import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Condition, GradedCompany } from '@prisma/client';

export class UpdateCartaInCollezioneDto {
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

  @ApiProperty({ example: '2024-02-01', required: false })
  @IsOptional()
  @IsDate()
  condition_date?: Date;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiProperty({ example: '2024-02-01', required: false })
  @IsOptional()
  @IsDate()
  acquired_date?: Date;

  @ApiProperty({ example: 30.0, required: false })
  @IsOptional()
  @IsNumber()
  acquired_price?: number;

  @ApiProperty({ example: 'Nuovo acquisto', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: 'scan-456', required: false })
  @IsOptional()
  @IsString()
  scan_id?: string;
}