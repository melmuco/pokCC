import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Scansione, ScansioneStatus } from '@prisma/client';
import { createWorker } from 'tesseract.js';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import natural from 'natural';
import { VisualMatchService } from '../visual-match/visual-match.service';
import { ScanGateway } from '../gateway/scan.gateway';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

@Injectable()
export class ScansioniService {
  private readonly logger = new Logger(ScansioniService.name);
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'scansioni');

  constructor(
    private prisma: PrismaService,
    private visualMatchService: VisualMatchService,
    private scanGateway: ScanGateway,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private validateFileName(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('File extension not allowed');
    }
    return ext;
  }

  private generateSafeFilename(ext: string): string {
    return `${crypto.randomBytes(16).toString('hex')}${ext}`;
  }

  private sanitizePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(this.uploadPath)) {
      throw new BadRequestException('Invalid file path');
    }
    return normalized;
  }

  async create(imageBuffer: Buffer, originalFilename: string, userId?: number): Promise<Scansione> {
    const scansione = await this.prisma.scansione.create({
      data: {
        status: ScansioneStatus.PENDING,
        userId,
      },
    });

    await this.processImage(scansione.id, imageBuffer, originalFilename);

    return this.prisma.scansione.findUnique({ where: { id: scansione.id } });
  }

  async findOne(id: number): Promise<Scansione | null> {
    return this.prisma.scansione.findUnique({
      where: { id },
      include: { matchedCard: true },
    });
  }

  private async processImage(scansioneId: number, imageBuffer: Buffer, originalFilename: string): Promise<void> {
    const scansione = await this.prisma.scansione.findUnique({ where: { id: scansioneId } });
    if (!scansione) return;

    this.scanGateway.emitProgress(scansioneId, 'pending', 0);

    await this.prisma.scansione.update({
      where: { id: scansioneId },
      data: { status: ScansioneStatus.PROCESSING },
    });

    this.scanGateway.emitProgress(scansioneId, 'processing', 10);

    try {
      const processed = await this.prepareImages(scansioneId, imageBuffer, originalFilename);
      this.scanGateway.emitProgress(scansioneId, 'processing', 25);

      const ocrResult = await this.performOCR(processed.medium.path);
      this.scanGateway.emitProgress(scansioneId, 'processing', 50);

      const extractedData = this.extractCardData(ocrResult.data.text);

      let matchedCard = await this.findMatchingCard(extractedData);

      if (!matchedCard) {
        this.logger.log(`OCR fallback to visual matching for scan ${scansioneId}`);
        matchedCard = await this.visualMatchService.findMatchingCard(
          processed.medium.path,
          extractedData.cardName ? [] : [],
        );
      }

      this.scanGateway.emitProgress(scansioneId, 'processing', 75);

      await this.prisma.scansione.update({
        where: { id: scansioneId },
        data: {
          ocrText: ocrResult.data.text,
          setName: extractedData.setName,
          cardNumber: extractedData.cardNumber,
          cardName: extractedData.cardName,
          confidence: ocrResult.data.confidence,
          status: ScansioneStatus.COMPLETED,
          matchedCardId: matchedCard?.cardId ?? null,
          originalUrl: processed.original.url,
          mediumUrl: processed.medium.url,
          thumbnailUrl: processed.thumbnail.url,
        },
      });

      this.scanGateway.emitProgress(scansioneId, 'completed', 100);
      this.scanGateway.emitCompleted(scansioneId, {
        scanId: scansioneId,
        status: 'completed',
        cardName: extractedData.cardName,
        setName: extractedData.setName,
        cardNumber: extractedData.cardNumber,
        matchedCardId: matchedCard?.cardId ?? null,
      });
    } catch (error) {
      this.logger.error(`Error processing image ${scansioneId}:`, error);
      await this.prisma.scansione.update({
        where: { id: scansioneId },
        data: { status: ScansioneStatus.FAILED },
      });
      this.scanGateway.emitProgress(scansioneId, 'failed', 0);
      this.scanGateway.emitFailed(scansioneId, error instanceof Error ? error.message : String(error));
    }
  }

  private async prepareImages(scansioneId: number, buffer: Buffer, filename: string) {
    const ext = this.validateFileName(filename);
    const uniqueSuffix = this.generateSafeFilename(ext);

    const originalPath = path.join(this.uploadPath, `${scansioneId}-original${uniqueSuffix}`);
    const mediumPath = path.join(this.uploadPath, `${scansioneId}-medium${uniqueSuffix}`);
    const thumbnailPath = path.join(this.uploadPath, `${scansioneId}-thumbnail${uniqueSuffix}`);

    this.sanitizePath(originalPath);
    this.sanitizePath(mediumPath);
    this.sanitizePath(thumbnailPath);

    fs.writeFileSync(originalPath, buffer);

    await sharp(buffer)
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(mediumPath);

    await sharp(buffer)
      .resize(200, null, { withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toFile(thumbnailPath);

    const baseUrl = `/uploads/scansioni/${scansioneId}`;

    return {
      original: { path: originalPath, url: `${baseUrl}-original${uniqueSuffix}` },
      medium: { path: mediumPath, url: `${baseUrl}-medium${uniqueSuffix}` },
      thumbnail: { path: thumbnailPath, url: `${baseUrl}-thumbnail${uniqueSuffix}` },
    };
  }

  private async performOCR(imagePath: string) {
    const worker = await createWorker('eng', 1, {
      logger: (m) => this.logger.debug(`OCR ${m}`, 'ocr'),
    });

    const result = await worker.recognize(imagePath);

    await worker.terminate();

    return result;
  }

  private extractCardData(text: string) {
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    let setName: string | null = null;
    let cardNumber: string | null = null;
    let cardName: string | null = null;

    const setNamePattern = /(?:Set|Set\s*No\.?\s*)(\w+(?:\s+\w+)*)/i;
    const cardNumberPattern = /(?:#\s*|No\.?\s*)(\d+)/i;
    const setNameFromLine = /(?:Base|Jungle|Fossil|Team|Legendary|Gym|Expedition|Neo|Aquapolis|Skyridge|EX|Diamond\s+Pearl|Platinum|Legends|Undaunted|Unleashed|Rising|Abyss|Hidden|Legends\ Awakening)/i;

    for (const line of lines) {
      if (!setName && setNameFromLine.test(line)) {
        const match = line.match(setNamePattern);
        if (match) setName = match[1];
      }

      if (!cardNumber) {
        const match = line.match(cardNumberPattern);
        if (match) cardNumber = match[1];
      }

      if (!cardName && line.length > 0 && line.length < 30 && !line.match(/^\d+$/)) {
        if (setName && setName?.test(line)) continue;
        if (line.match(/#\d+/)) continue;
        cardName = line;
      }
    }

    return { setName, cardNumber, cardName };
  }

  private async findMatchingCard(extractedData: { setName?: string | null; cardNumber?: string | null; cardName?: string | null }): Promise<any | null> {
    const cards = await this.prisma.carta.findMany({
      where: {
        OR: [{ number: extractedData.cardNumber || undefined }, { name: { contains: extractedData.cardName || '', mode: 'insensitive' } }],
      },
      include: { set: true },
      take: 50,
    });

    if (cards.length === 0) return null;

    const tokenizer = new natural.WordTokenizer();

    let bestMatch: any = null;
    let bestScore = 0;

    const queryText = (extractedData.cardName || '').toLowerCase();

    cards.forEach((card) => {
      const cardText = `${card.name} ${card.set?.name || ''} ${card.number || ''}`.toLowerCase();
      const similarity = natural.Jaccard.similarity(queryText, cardText);

      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = card;
      }
    });

    if (bestScore > 0.3) {
      return { cardId: bestMatch.id };
    }

    return null;
  }
}