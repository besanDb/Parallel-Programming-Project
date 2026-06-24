import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from './dto/token.dto';
import { UserService } from 'src/user/user.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async register(registerDto: RegisterDto) {
    const userExists = await this.userService._getByEmail(registerDto.email);

    if (userExists) {
      return {
        success: false,
        message: 'Email is in use',
      };
    }
    const user = await this.userService._createUser(registerDto);

    return this._tokenizeUser(user.id);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService._getByEmail(loginDto.email);

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }
    const isPasswordValid = await this._checkPassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Credentials do not match',
      };
    }

    return this._tokenizeUser(user.id);
  }

  async refresh(refreshTokenDto: TokenDto) {
    const tokenExists = await this.userService._getByToken(
      refreshTokenDto.token,
    );

    if (!tokenExists) throw new UnauthorizedException('Unauthorized');

    if (this._isValidToken(refreshTokenDto.token))
      return this._tokenizeUser(tokenExists.id);
    else throw new UnauthorizedException('Refresh token expired or invalid');
  }

  async logout(userId: number) {
    await this.userService._updateRefreshToken(userId, null);
    return true;
  }

  _generateTokens(userId: number) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ userId }, { expiresIn: '3d' });
    return {
      accessToken,
      refreshToken,
    };
  }
  async _hash(str: string) {
    // return await bcrypt.hash(str, 10);
    return await argon2.hash(str, {
      type: argon2.argon2id,
      memoryCost: 2048,
      timeCost: 1,
      parallelism: 1,
    });
  }

  async _checkPassword(str: string, hashedStr: string) {
    // return await bcrypt.compare(str, hashedStr);
    return await argon2.verify(hashedStr, str);
  }

  // async _checkPassword(str: string, hashedStr: string) {
  //   return await bcrypt.compare(str, hashedStr);
  // }

  async _tokenizeUser(userId: number) {
    const { accessToken, refreshToken } = this._generateTokens(userId);
    await this.userService._updateRefreshToken(userId, refreshToken);
    console.log('Registered');
    return { accessToken, refreshToken };
  }

  _isValidToken(token: string) {
    try {
      this.jwtService.verify(token);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }
}
