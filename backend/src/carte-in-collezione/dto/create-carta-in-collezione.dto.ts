import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Condition, GradedCompany } from '@prisma/client';

export class CreateCartaInCollezioneDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  card_id: number;

  @ApiProperty({ example: 'NearMint', enum: Condition, required: false })
  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @ApiProperty({ example: 'PSA', enum: GradedCompany, required: false })
  @IsOptional()
  @IsEnum(GradedCompany)
  graded_company?: GradedCompany;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  graded_grade?: number;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDate()
  condition_date?: Date;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDate()
  acquired_date?: Date;

  @ApiProperty({ example: 25.5, required: false })
  @IsOptional()
  @IsNumber()
  acquired_price?: number;

  @ApiProperty({ example: 'Prima edizione', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: 'scan-123', required: false })
  @IsOptional()
  @IsString()
  scan_id?: string;
}