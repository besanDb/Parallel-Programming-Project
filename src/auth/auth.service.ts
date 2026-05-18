import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from './dto/token.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async register(registerDto: RegisterDto) {
    const userExists = await this.userService._getByEmail(registerDto.email);

    if (userExists) throw new BadRequestException('Email is in use');

    const user = await this.userService._createUser(registerDto);

    return this._tokenizeUser(user.id);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService._getByEmail(loginDto.email);

    if (!user) throw new UnauthorizedException('Credentials do not match');

    if (await this._checkPassword(loginDto.password, user.password)) {
      return this._tokenizeUser(user.id);
    }

    throw new UnauthorizedException('Credentials do not match');
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
    return await bcrypt.hash(str, 10);
  }

  async _checkPassword(str: string, hashedStr: string) {
    return await bcrypt.compare(str, hashedStr);
  }

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
