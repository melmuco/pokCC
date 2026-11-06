import { Controller, Get, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ValuationService } from './valuation.service';

@ApiTags('valuation')
@Controller('valuation')
export class ValuationController {
  constructor(private readonly valuationService: ValuationService) {}

  @Get('collection/:id')
  @BearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get collection valuation' })
  @ApiResponse({ status: 200, description: 'Collection valuation details' })
  async getCollectionValuation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return await this.valuationService.calculateCollectionValuation(id);
  }

  @Get('user/total')
  @BearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user total collection value with set breakdown' })
  @ApiResponse({ status: 200, description: 'Total valuation' })
  async getUserTotalValuation(@Request() req) {
    return await this.valuationService.getUserTotalCollectionValue(req.user.id);
  }
}