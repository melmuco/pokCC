import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { SetsModule } from './sets/sets.module';
import { UsersModule } from './users/users.module';
import { CollectionsModule } from './collections/collections.module';
import { CarteInCollezioneModule } from './carte-in-collezione/carte-in-collezione.module';
import { ScansioniModule } from './scansioni/scansioni.module';
import { TcgModule } from './tcg/tcg.module';
import { PricingModule } from './pricing/pricing.module';
import { GradingModule } from './grading/grading.module';
import { VisualMatchModule } from './visual-match/visual-match.module';
import { GatewayModule } from './gateway/gateway.module';
import { HealthController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    CardsModule,
    SetsModule,
    UsersModule,
    CollectionsModule,
    CarteInCollezioneModule,
    ScansioniModule,
    TcgModule,
    PricingModule,
    GradingModule,
    VisualMatchModule,
    GatewayModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}