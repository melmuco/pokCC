import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindCardsDto {
  @ApiProperty({ example: 'Pikachu', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  set_id?: string;

  @ApiProperty({ example: 'Common', required: false })
  @IsOptional()
  @IsString()
  rarity?: string;

  @ApiProperty({ example: 'Pokémon', required: false })
  @IsOptional()
  @IsString()
  supertype?: string;

  @ApiProperty({ example: 'Electric,Lightning', required: false })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiProperty({ example: '50', required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ example: '0', required: false })
  @IsOptional()
  @IsString()
  offset?: string;
}