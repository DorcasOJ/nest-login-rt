import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signuplocal(authDto: AuthDto): Promise<Tokens> {
    try {
      const hash = this.hashData(authDto.password);
      const newUser = await this.prisma.user.create({
        data: {
          email: authDto.email,
          hash,
        },
      });

      const tokens = await this.getTokens(newUser.id, newUser.email);
      return tokens;
    } catch (error) {
      throw new ForbiddenException(error);
    }
  }

  async signinlocal(authDto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: authDto.email },
    });
    if (!user) throw new ForbiddenException('Access Denied');
    const passwordMatches = await bcrypt.compare(authDto.password, user.hash);
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: { id: userId, hashedRt: { not: null } },
      data: { hashedRt: null },
    });
  }

  async refreshTokens(userId: number, rt: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');
    const rtMatches = await bcrypt.compare(rt, user.hashedRt);
    if (!rtMatches) throw new ForbiddenException('Acess Denied');
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = this.hashData(rt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash },
    });
  }

  hashData(data: string) {
    const SALT = bcrypt.genSaltSync();
    return bcrypt.hashSync(data, SALT);
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    // const jwtPayload: JwtPayload = {};
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_AT_SECRET'),
          expiresIn: 60 * 15,
        },
      ),

      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_RT_SECRET'),
          expiresIn: 60 * 60 * 24 * 7,
        },
      ),
    ]);
    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
