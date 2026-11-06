import { Controller, Get, Param, Body, Post, Patch, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CollectionsService } from './collections.service';
import { CreateCollezioneDto, UpdateCollezioneDto } from './dto';
import { Response } from 'express';

@ApiTags('collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all collections for the current user' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'List of collections' })
  findAll(@Request() req) {
    return this.collectionsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection by id' })
  @ApiResponse({ status: 200, description: 'Collection details' })
  @ApiResponse({ status: 401, description: 'Not authorized' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.collectionsService.findOne(+id, req?.user?.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new collection' })
  @BearerAuth()
  @ApiResponse({ status: 201, description: 'Collection created' })
  create(@Request() req, @Body() createCollezioneDto: CreateCollezioneDto) {
    return this.collectionsService.create(req.user.id, createCollezioneDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update a collection' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Collection updated' })
  update(@Param('id') id: string, @Request() req, @Body() updateCollezioneDto: UpdateCollezioneDto) {
    return this.collectionsService.update(+id, req.user.id, updateCollezioneDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a collection' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'Collection deleted' })
  remove(@Param('id') id: string, @Request() req) {
    return this.collectionsService.remove(+id, req.user.id);
  }

  @Get(':id/export')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Export collection as CSV' })
  @BearerAuth()
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @Response({ status: 200, contentType: 'text/csv' })
  async export(@Param('id') id: string, @Request() req, @Res({ passthrough: true }) res: Response) {
    const collection = await this.collectionsService.findOne(+id, req.user.id);
    if (!collection) {
      res.status(404).send('Collection not found');
      return;
    }

    const csv = this.generateCSV(collection);
    res.setHeader('Content-Disposition', `attachment; filename="collezione-${collection.nome}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    return csv;
  }

  private generateCSV(collection: any): string {
    const headers = ['ID', 'Nome Carta', 'Set', 'Numero', 'Quantita', 'Condizione', 'Graded Company', 'Graded Grade', 'Valore Stimato'];
    const rows = collection.carte?.map((item: any) => [
      item.id,
      item.carta?.name || 'N/A',
      item.carta?.set?.name || 'N/A',
      item.carta?.number || 'N/A',
      item.quantity || 1,
      item.condition || 'N/A',
      item.graded_company || 'N/A',
      item.graded_grade || 'N/A',
      '',
    ]) || [];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}