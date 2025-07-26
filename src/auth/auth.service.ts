import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "../mail/mail.service";
import * as uuid from "uuid";
import * as bcrypt from "bcrypt";
import {
  ForgotPasswordDto,
  ReactivateAccountDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
} from "./dto";
import { Response } from "express";
import { User, Role } from "@prisma/client";
import { Tokens } from "../common/types";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  // ========================================================================
  // ==                      ASOSIY AUTENTIFIKATSIYA                     ==
  // ========================================================================

  async signUp(dto: SignUpDto) {
    const { email, password, confirmPassword } = dto;
    if (password !== confirmPassword) {
      throw new BadRequestException("Parollar mos kelmadi.");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      if (existingUser.isActive) {
        throw new ConflictException("Bu email allaqachon ro'yxatdan o'tgan.");
      } else {
        throw new ConflictException(
          "Bu email bilan faolsizlantirilgan akkaunt mavjud. Uni qayta tiklash mumkin."
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 7);
    const verificationCode = uuid.v4();

    const newUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        username: dto.username,
        passwordHash,
        verificationCode, // Verifikatsiya kodi saqlanadi
        isVerified: false, // Foydalanuvchi o'zi tasdiqlashi kerak
      },
    });

    try {
      // TUZATILDI: Siz taqdim etgan to'g'ri metod ishlatilmoqda
      await this.mailService.sendMail(newUser);
    } catch (error) {
      await this.prisma.user.delete({ where: { id: newUser.id } });
      throw new InternalServerErrorException(
        "Email yuborishda xatolik yuz berdi. Iltimos, qaytadan urunib ko'ring."
      );
    }

    return { message: "Tasdiqlash havolasi emailingizga yuborildi." };
  }

  async signIn(dto: SignInDto, res: Response) {
    const { login, password } = dto;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Login yoki parol noto‘g‘ri.");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException("Login yoki parol noto‘g‘ri.");
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        "Sizning akkauntingiz faol emas. Iltimos, administratorga murojaat qiling."
      );
    }

    if (!user.isVerified) {
      throw new ForbiddenException("Iltimos, avval emailingizni tasdiqlang.");
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    res.cookie("refresh_token", tokens.refresh_token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return { access_token: tokens.access_token };
  }

  async signOut(userId: string, res: Response) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refreshTokenHash: { not: null },
      },
      data: { refreshTokenHash: null },
    });
    res.clearCookie("refresh_token");
    return { message: "Muvaffaqiyatli tizimdan chiqildi." };
  }

  async refreshToken(userId: string, refreshToken: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException("Ruxsat yo'q.");
    }

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash
    );
    if (!tokenMatch) {
      throw new ForbiddenException("Ruxsat yo'q.");
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    res.cookie("refresh_token", tokens.refresh_token, {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 kun
      httpOnly: true,
    });

    return { access_token: tokens.access_token };
  }

  // ========================================================================
  // ==                      PAROLNI TIKLASH                             ==
  // ========================================================================

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return {
        message:
          "Agar bunday email mavjud bo'lsa, unga parolni tiklash havolasi yuborildi.",
      };
    }

    const resetToken = uuid.v4();
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 daqiqa

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { resetPasswordToken: resetToken, resetTokenExpires: expires },
    });

    try {
      // TUZATILDI: Sizning `sendResetPasswordEmail` metodingiz ishlatilmoqda
      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3001"}/reset-password/${resetToken}`;
      await this.mailService.sendResetPasswordEmail(user.email, resetLink);
    } catch (error) {
      throw new InternalServerErrorException(
        "Email yuborishda xatolik yuz berdi."
      );
    }

    return { message: "Parolni tiklash havolasi yuborildi." };
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    const { password, confirmPassword } = dto;
    if (password !== confirmPassword) {
      throw new BadRequestException("Parollar mos emas.");
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetTokenExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException("Token yaroqsiz yoki muddati o'tgan.");
    }

    const passwordHash = await bcrypt.hash(password, 7);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: "Parol muvaffaqiyatli yangilandi." };
  }

  // ========================================================================
  // ==                      YORDAMCHI METODLAR                          ==
  // ========================================================================

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 7);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async getTokens(userId: string, email: string, role: Role): Promise<Tokens> {
    const payload = { id: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async requestReactivation(dto: ReactivateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message:
          "Agar bunday email mavjud bo'lsa, unga akkauntni tiklash havolasi yuborildi.",
      };
    }
    if (user.isActive) {
      throw new BadRequestException("Bu akkaunt allaqachon faol holatda.");
    }

    const reactivationToken = uuid.v4();
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 daqiqa

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        reactivationToken: reactivationToken,
        reactivationTokenExpires: expires,
      },
    });

    try {
      const reactivationLink = `${process.env.BACKEND_URL || "http://localhost:3000/api"}/auth/confirm-reactivation/${reactivationToken}`;
      await this.mailService.sendEmail(
        user.email,
        "Akkauntni Qayta Tiklash - TaskManager",
        `<h2>Akkauntni Qayta Tiklash</h2>
         <p>Salom! Akkauntingizni qayta aktivlashtirish uchun quyidagi havolani bosing:</p>
         <a href="${reactivationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Akkauntni Aktivlashtirish
         </a>
         <p>Bu havola 15 daqiqa davomida amal qiladi.</p>`
      );
    } catch (error) {
      throw new InternalServerErrorException(
        "Email yuborishda xatolik yuz berdi."
      );
    }

    return {
      message:
        "Agar bunday email mavjud bo'lsa, unga akkauntni tiklash havolasi yuborildi.",
    };
  }

  async confirmReactivation(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        reactivationToken: token,
        reactivationTokenExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException("Havola yaroqsiz yoki muddati o'tgan.");
    }

    if (user.isActive) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          reactivationToken: null,
          reactivationTokenExpires: null,
        },
      });
      return { message: "Akkaunt allaqachon faol." };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        isVerified: true,
        reactivationToken: null,
        reactivationTokenExpires: null,
      },
    });

    return {
      message:
        "Akkauntingiz muvaffaqiyatli tiklandi. Endi tizimga kirishingiz mumkin.",
    };
  }
}
