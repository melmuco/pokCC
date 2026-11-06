import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CarteInCollezioneController } from './carte-in-collezione.controller';
import { CarteInCollezioneService } from './carte-in-collezione.service';

@Module({
  imports: [AuthModule],
  controllers: [CarteInCollezioneController],
  providers: [CarteInCollezioneService],
  exports: [CarteInCollezioneService],
})
export class CarteInCollezioneModule {}