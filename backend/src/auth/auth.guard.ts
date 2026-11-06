import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

/**
 * Guard di autenticazione JWT.
 * Estende il Passport AuthGuard predefinito per la strategia "jwt"
 * (collegata a JwtStrategy in jwt.strategy.ts).
 *
 * Viene usato come @UseGuards(AuthGuard) sugli endpoint protetti
 * (es. CRUD collezioni, carte in collezione).
 */
@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {}