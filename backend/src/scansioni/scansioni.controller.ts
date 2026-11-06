import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ScansioniService } from './scansioni.service';
import { ScansioneResponseDto } from './dto/scansione-response.dto';

@ApiTags('scansioni')
@Controller('scansioni')
export class ScansioniController {
  constructor(private readonly scansioniService: ScansioniService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @BearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload card image for scanning' })
  @ApiBody({
    description: 'Card image file',
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            image: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: ScansioneResponseDto })
  @UseInterceptors(FileInterceptor('image'))
  async create(@UploadedFile() file: Express.Multer.File): Promise<ScansioneResponseDto> {
    return this.scansioniService.create(file.buffer, file.originalname);
  }

  @Get(':id')
  @BearerAuth()
  @ApiOperation({ summary: 'Get scan status and result' })
  @ApiResponse({ status: 200, type: ScansioneResponseDto })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ScansioneResponseDto> {
    return this.scansioniService.findOne(id);
  }
}