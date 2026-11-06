import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCollezioneDto {
  @ApiProperty({ example: 'La mia collezione Base Set' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'Collezione personale delle prime edizioni', required: false })
  @IsOptional()
  @IsString()
  descrizione?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;
}