import { ApiProperty } from '@nestjs/swagger';
import { ScansioneStatus } from '@prisma/client';

export class ScansioneResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false })
  ocrText?: string | null;

  @ApiProperty({ required: false })
  setName?: string | null;

  @ApiProperty({ required: false })
  cardNumber?: string | null;

  @ApiProperty({ required: false })
  cardName?: string | null;

  @ApiProperty()
  confidence: number | null;

  @ApiProperty()
  status: ScansioneStatus;

  @ApiProperty({ required: false })
  matchedCardId?: number | null;

  @ApiProperty({ required: false })
  originalUrl?: string | null;

  @ApiProperty({ required: false })
  mediumUrl?: string | null;

  @ApiProperty({ required: false })
  thumbnailUrl?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}