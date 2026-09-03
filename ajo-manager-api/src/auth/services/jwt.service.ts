import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify, JwtPayload } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  phone: string;
  role: string;
}

@Injectable()
export class JwtService {
  private jwtSecret: string;
  private jwtExpiration: string;
  private jwtRefreshExpiration: string;

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get('JWT_SECRET') || 'dev-secret-key-min-32-chars-long-xxx';
    this.jwtExpiration = this.configService.get('JWT_EXPIRATION') || '3600';
    this.jwtRefreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION') || '2592000';
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload: TokenPayload): string {
    return sign(payload, this.jwtSecret, {
      expiresIn: parseInt(this.jwtExpiration),
      algorithm: 'HS256',
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(userId: string): string {
    return sign({ userId }, this.jwtSecret, {
      expiresIn: parseInt(this.jwtRefreshExpiration),
      algorithm: 'HS256',
    });
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  decodeToken(token: string): any {
    try {
      const decoded = sign(token, this.jwtSecret, { noTimestamp: true });
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
