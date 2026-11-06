import { Controller, Post, Param, Body, UseGuards, Request, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { VisualMatchService } from './visual-match.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('visual-match')
@Controller('visual-match')
export class VisualMatchController {
  constructor(private readonly visualMatchService: VisualMatchService) {}

  @Post('compare/:cardId')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/scansioni',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate similarity between scan and reference image' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Similarity calculated' })
  async compare(
    @Param('cardId') cardId: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { similarity: 0, match: false };
    }

    const scannedEmbedding = await this.visualMatchService.generateEmbedding(file.path);
    if (!scannedEmbedding) {
      return { similarity: 0, match: false };
    }

    const cardIdNum = parseInt(cardId);
    const referenceImagePath = await this.getReferenceImagePath(cardIdNum);

    if (!referenceImagePath) {
      return { similarity: 0, match: false };
    }

    const referenceEmbedding = await this.visualMatchService.generateEmbedding(referenceImagePath);
    if (!referenceEmbedding) {
      return { similarity: 0, match: false };
    }

    const similarity = this.visualMatchService.cosineSimilarity(scannedEmbedding, referenceEmbedding);
    const isMatch = similarity > this.visualMatchService.getSimilarityThreshold();

    return {
      similarity,
      match: isMatch,
      cardId: cardIdNum,
    };
  }

  private async getReferenceImagePath(cardId: number): Promise<string | null> {
    const fs = require('fs');
    const path = require('path');
    const referencePath = path.join('./uploads/scansioni/reference', `${cardId}.jpg`);

    if (fs.existsSync(referencePath)) {
      return referencePath;
    }

    return null;
  }
}