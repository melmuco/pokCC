import { IsString, IsOptional } from 'class-validator';

export class CreateScansioneDto {
  @IsOptional()
  @IsString()
  setName?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardName?: string;
}