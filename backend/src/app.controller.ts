import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, HttpStatus } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Service is running correctly',
    };
  }
}