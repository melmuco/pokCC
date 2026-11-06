import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CarteInCollezioneService } from './carte-in-collezione.service';
import { CreateCartaInCollezioneDto, UpdateCartaInCollezioneDto } from './dto';

@ApiTags('carte-in-collezione')
@Controller('collections/:collectionId/cards')
export class CarteInCollezioneController {
  constructor(private readonly carteInCollezioneService: CarteInCollezioneService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List cards in a collection' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'List of cards in the collection' })
  list(@Param('collectionId') collectionId: string, @Request() req) {
    return this.carteInCollezioneService.findByCollezione(+collectionId, req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Add a card to a collection' })
  @BearerAuth()
  @ApiResponse({ status: 201, description: 'Card added' })
  @ApiResponse({ status: 409, description: 'Card already in collection' })
  add(@Param('collectionId') collectionId: string, @Request() req, @Body() dto: CreateCartaInCollezioneDto) {
    return this.carteInCollezioneService.add(req.user.id, { ...dto, collezione_id: +collectionId });
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update a card entry in a collection' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Entry updated' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateCartaInCollezioneDto) {
    return this.carteInCollezioneService.update(req.user.id, +id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Remove a card from a collection' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Entry removed' })
  remove(@Param('id') id: string, @Request() req) {
    return this.carteInCollezioneService.remove(req.user.id, +id);
  }
}