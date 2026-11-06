import { Module } from '@nestjs/common';
import { ScansioniService } from './scansioni.service';
import { ScansioniController } from './scansioni.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VisualMatchModule } from '../visual-match/visual-match.module';
import { ScanGateway } from '../gateway/scan.gateway';

@Module({
  imports: [PrismaModule, VisualMatchModule],
  controllers: [ScansioniController],
  providers: [ScansioniService, ScanGateway],
})
export class ScansioniModule {}