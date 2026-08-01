import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly projectId: string;

  constructor(private configService: ConfigService) {
    this.projectId =
      this.configService.get<string>('FIREBASE_PROJECT_ID') ||
      'bookworm-6c9ec';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.verifyToken(token);
      // jose types email as unknown — coerce for Nest controllers
      request.user = {
        ...payload,
        sub: payload.sub,
        uid: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      };
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async verifyToken(token: string) {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${this.projectId}`,
      audience: this.projectId,
    });

    if (!payload.sub) {
      throw new Error('Invalid token - missing uid');
    }

    return payload;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
