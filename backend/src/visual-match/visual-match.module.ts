import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VisualMatchController } from './visual-match.controller';
import { VisualMatchService } from './visual-match.service';

@Module({
  imports: [AuthModule],
  controllers: [VisualMatchController],
  providers: [VisualMatchService],
  exports: [VisualMatchService],
})
export class VisualMatchModule {}