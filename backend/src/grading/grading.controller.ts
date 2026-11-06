import { Controller, Patch, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { GradingService } from './grading.service';
import { Condition, GradedCompany } from '@prisma/client';
import { IsOptional, IsEnum, IsInt } from 'class-validator';

class UpdateGradingDto {
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
}

@ApiTags('grading')
@Controller('cards/:cardId/grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Patch('collection/:collectionId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update card grading information' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Grading updated' })
  update(
    @Param('cardId') cardId: string,
    @Param('collectionId') collectionId: string,
    @Request() req,
    @Body() body: UpdateGradingDto,
  ) {
    return this.gradingService.updateGrading(
      req.user.id,
      parseInt(cardId),
      parseInt(collectionId),
      body,
    );
  }
}