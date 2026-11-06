import { Controller, Get, Param, Body, Post, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { FindCardsDto } from './dto';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cards with filters' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Paginated list of cards' })
  findAll(@Query() query: FindCardsDto) {
    return this.cardsService.findAll(query);
  }

  @Get('set/:setId')
  @ApiOperation({ summary: 'Get cards by set' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'List of cards in the set' })
  findBySet(@Param('setId') setId: string) {
    return this.cardsService.findBySet(+setId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by id' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Card details' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create card (admin)' })
  @BearerAuth()
  @ApiResponse({ status: 201, description: 'Card created' })
  create(@Body() data: any) {
    return this.cardsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update card (admin)' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Card updated' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.cardsService.update(+id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete card (admin)' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Card deleted' })
  remove(@Param('id') id: string) {
    return this.cardsService.remove(+id);
  }
}