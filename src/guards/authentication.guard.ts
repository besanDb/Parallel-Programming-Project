import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

export interface AuthRequest extends Request {
  user: {
    id: number;
  };
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: AuthRequest = context
      .switchToHttp()
      .getRequest<AuthRequest>();

    if (isPublic || request.path === '/metrics') {
      return true;
    }

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    try {
      const payload = this.jwtService.verify<{ userId: number }>(token);
      request.user = { id: payload.userId };
    } catch (error) {
      Logger.error(error);
      throw new UnauthorizedException('Token is invalid');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    return request.headers.authorization?.split(' ')[1];
  }
}
