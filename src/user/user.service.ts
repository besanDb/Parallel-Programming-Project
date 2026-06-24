import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from 'src/auth/dto/register.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async _getByEmail(email: string) {
    return await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async _getByToken(refreshToken: string) {
    return await this.prisma.user.findFirst({
      where: {
        refreshToken,
      },
    });
  }

  async _createUser(registerDto: RegisterDto) {
    const hashedPassword = await argon2.hash(registerDto.password, {
      type: argon2.argon2id,
      memoryCost: 2048,
      timeCost: 1,
      parallelism: 1,
    });

    return await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
      },
    });
  }

  async _updateRefreshToken(userId: number, refreshToken: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
