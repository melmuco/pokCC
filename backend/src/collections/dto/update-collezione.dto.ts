import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCollezioneDto {
  @ApiProperty({ example: 'Collezione rinominata', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ example: 'Nuova descrizione', required: false })
  @IsOptional()
  @IsString()
  descrizione?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;
}