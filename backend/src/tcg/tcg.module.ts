import { Module } from '@nestjs/common';
import { TcgService } from './tcg.service';

@Module({
  providers: [TcgService],
  exports: [TcgService],
})
export class TcgModule {}