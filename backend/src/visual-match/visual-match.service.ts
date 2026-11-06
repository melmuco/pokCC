import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VisualMatchService {
  private readonly logger = new Logger(VisualMatchService.name);
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'scansioni');
  private embeddingCache: Map<string, number[]> = new Map();
  private similarityThreshold = 0.6;

  async initialize(): Promise<void> {
    this.logger.log('VisualMatchService initialized');
  }

  async generateEmbedding(imagePath: string): Promise<number[] | null> {
    try {
      if (!fs.existsSync(imagePath)) {
        this.logger.error(`Image not found: ${imagePath}`);
        return null;
      }

      const cacheKey = `embedding-${imagePath}`;
      if (this.embeddingCache.has(cacheKey)) {
        return this.embeddingCache.get(cacheKey)!;
      }

      this.logger.debug(`Generating embedding for ${imagePath}`);
      return null;
    } catch (error) {
      this.logger.error(`Error generating embedding for ${imagePath}`, error);
      return null;
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async findBestMatch(
    scanEmbedding: number[],
    referenceEmbeddings: { cardId: number; embedding: number[] }[],
  ): Promise<{ cardId: number; similarity: number } | null> {
    if (!scanEmbedding || referenceEmbeddings.length === 0) {
      return null;
    }

    let bestMatch: { cardId: number; similarity: number } | null = null;
    let bestSimilarity = 0;

    for (const ref of referenceEmbeddings) {
      const similarity = this.cosineSimilarity(scanEmbedding, ref.embedding);

      if (similarity > this.similarityThreshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { cardId: ref.cardId, similarity };
      }
    }

    return bestMatch;
  }

  async findMatchingCard(
    scannedImagePath: string,
    referenceCardIds: number[],
  ): Promise<{ cardId: number; similarity: number } | null> {
    const scannedEmbedding = await this.generateEmbedding(scannedImagePath);
    if (!scannedEmbedding) return null;

    const referenceEmbeddings: { cardId: number; embedding: number[] }[] = [];

    for (const cardId of referenceCardIds) {
      const cacheKey = `embedding-card-${cardId}`;
      let embedding = this.embeddingCache.get(cacheKey);

      if (!embedding) {
        const referenceImagePath = await this.getReferenceImageForCard(cardId);
        if (referenceImagePath) {
          embedding = await this.generateEmbedding(referenceImagePath) || [];
          if (embedding && embedding.length > 0) {
            this.embeddingCache.set(cacheKey, embedding);
            referenceEmbeddings.push({ cardId, embedding });
          }
        }
      } else if (embedding.length > 0) {
        referenceEmbeddings.push({ cardId, embedding });
      }
    }

    return this.findBestMatch(scannedEmbedding, referenceEmbeddings);
  }

  private async getReferenceImageForCard(cardId: number): Promise<string | null> {
    const cardImageDir = path.join(this.uploadPath, 'reference');
    const cardImagePath = path.join(cardImageDir, `${cardId}.jpg`);

    if (fs.existsSync(cardImagePath)) {
      return cardImagePath;
    }

    return null;
  }

  clearCache(): void {
    this.embeddingCache.clear();
  }

  getSimilarityThreshold(): number {
    return this.similarityThreshold;
  }
}