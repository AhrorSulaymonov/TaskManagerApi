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
import * as bcrypt from "bcrypt";
import * as uuid from "uuid";
import { Role } from "@prisma/client";
import { MailService } from "../mail/mail.service";
import { FileAmazonService } from "../file-amazon/file-amazon.service"; // Sizning servis nomingiz
import {
  AdminResetPasswordDto,
  ConfirmEmailChangeDto,
  CreateUserDto,
  RequestEmailChangeDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  UpdateUserRoleDto,
} from "./dto";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly fileAmazonService: FileAmazonService
  ) {}

  private get activeUserCondition() {
    return { isActive: true };
  }

  private readonly userSelectFields = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    username: true,
    role: true,
    isActive: true,
    isVerified: true,
    createdAt: true,
  };

  private readonly userProfileInclude = {
    favoriteProjects: {
      select: { id: true, name: true, projectImageUrl: true },
    },
    favoriteTasks: {
      select: { id: true, title: true, projectId: true },
    },
    _count: {
      select: {
        ownedProjects: true,
        createdTasks: true,
        projectMemberships: true,
      },
    },
  };

  async findOneById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.activeUserCondition },
      include: this.userProfileInclude,
    });
    if (!user)
      throw new NotFoundException("Foydalanuvchi topilmadi yoki faol emas.");
    const { passwordHash, ...result } = user;
    return result;
  }

  async findAllActiveUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: this.activeUserCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: this.userSelectFields,
      }),
      this.prisma.user.count({ where: this.activeUserCondition }),
    ]);
    return {
      data: users,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async createUserByAdmin(dto: CreateUserDto, adminId: string) {
    const { password, confirmPassword, email, role } = dto;
    if (password !== confirmPassword) {
      throw new BadRequestException("Kiritilgan parollar mos kelmadi.");
    }

    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (
      (role === Role.ADMIN || role === Role.SUPER_ADMIN) &&
      admin?.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        "Faqat SUPER_ADMIN boshqa admin yaratishi mumkin."
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      if (existingUser.isActive) {
        throw new ConflictException("Bu email allaqachon ro'yxatdan o'tgan.");
      } else {
        throw new ConflictException(
          "Bu email bilan faolsizlantirilgan akkaunt mavjud."
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
        phoneNumber: dto.phoneNumber,
        role: dto.role,
        passwordHash,
        verificationCode,
      },
    });

    try {
      // Admin yaratgan userga ham tasdiqlash xabari yuboriladi
      await this.mailService.sendMail(newUser);
    } catch (error) {
      // Agar email yuborishda xato bo'lsa, yaratilgan foydalanuvchini o'chiramiz
      await this.prisma.user.delete({ where: { id: newUser.id } });
      throw new InternalServerErrorException(
        "Email yuborishda xatolik yuz berdi. Foydalanuvchi yaratilmadi."
      );
    }

    const { passwordHash: _, ...result } = newUser;
    return result;
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
    image?: Express.Multer.File
  ) {
    const { username, phoneNumber } = dto;
    const user = await this.findOneById(userId);

    if (username && username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existing) throw new ConflictException("Bu username allaqachon band.");
    }
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existing = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existing)
        throw new ConflictException("Bu telefon raqami allaqachon band.");
    }

    let avatarImageUrl: string | undefined;
    if (image) {
      if (user.avatarImageUrl) {
        await this.fileAmazonService.deleteFile(user.avatarImageUrl);
      }
      avatarImageUrl = await this.fileAmazonService.uploadFile(image);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto, ...(avatarImageUrl && { avatarImageUrl }) },
      include: this.userProfileInclude,
    });
    const { passwordHash, ...result } = updatedUser;
    return result;
  }

  async updateOwnPassword(userId: string, dto: UpdateUserPasswordDto) {
    const { oldPassword, newPassword, confirmNewPassword } = dto;
    if (newPassword !== confirmNewPassword)
      throw new BadRequestException("Yangi parollar mos emas.");

    const user = await this.prisma.user.findFirst({
      where: { id: userId, ...this.activeUserCondition },
    });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi.");

    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.passwordHash
    );
    if (!isPasswordCorrect)
      throw new BadRequestException("Eski parol noto‘g‘ri.");

    const newHashedPassword = await bcrypt.hash(newPassword, 7);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHashedPassword },
    });
    return { message: "Parol muvaffaqiyatli yangilandi." };
  }

  async resetPasswordByAdmin(userId: string, dto: AdminResetPasswordDto) {
    const { newPassword, confirmNewPassword } = dto;
    if (newPassword !== confirmNewPassword)
      throw new BadRequestException("Yangi parollar mos emas.");

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi.");

    const newHashedPassword = await bcrypt.hash(newPassword, 7);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHashedPassword },
    });
    return {
      message: `Foydalanuvchi (${user.email}) paroli muvaffaqiyatli tiklandi.`,
    };
  }

  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi.");
    if (user.role === Role.SUPER_ADMIN)
      throw new ForbiddenException(
        "SUPER_ADMIN akkauntini faolsizlantirib bo'lmaydi."
      );

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false, refreshTokenHash: null },
    });
    return { message: "Foydalanuvchi muvaffaqiyatli faolsizlantirildi." };
  }

  async activate(link: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationCode: link },
    });
    if (!user)
      throw new NotFoundException(
        "Aktivatsiya havolasi noto‘g‘ri yoki eskirgan."
      );
    if (user.isVerified)
      throw new BadRequestException("Bu hisob allaqachon aktivlashtirilgan.");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, isActive: true, verificationCode: null },
    });
    return { message: "Hisob muvaffaqiyatli aktivlashtirildi." };
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi.");

    if (user.role === Role.SUPER_ADMIN && dto.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("SUPER_ADMIN rolini o'zgartirib bo'lmaydi.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
    const { passwordHash, ...result } = updatedUser;
    return result;
  }

  async requestEmailChange(userId: string, dto: RequestEmailChangeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Foydalanuvchi topilmadi.");

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash
    );
    if (!isPasswordValid) throw new UnauthorizedException("Parol noto‘g‘ri.");

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.newEmail },
    });
    if (existing) throw new BadRequestException("Bu email allaqachon band.");

    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: dto.newEmail },
    });

    const token = this.jwtService.sign(
      { sub: userId, newEmail: dto.newEmail },
      {
        secret: process.env.JWT_EMAIL_CHANGE_SECRET,
        expiresIn: "15m",
      }
    );

    const confirmUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/confirm-email-change?token=${token}`;
    await this.mailService.sendEmail(
      dto.newEmail,
      "Emailni tasdiqlang - TaskManager",
      `<p>Email manzilingizni o'zgartirish uchun havolani bosing: <a href="${confirmUrl}">Tasdiqlash</a></p>`
    );

    return { message: "Tasdiqlash havolasi yangi emailga yuborildi." };
  }

  async confirmEmailChange(dto: ConfirmEmailChangeDto) {
    try {
      const payload: { sub: string; newEmail: string } = this.jwtService.verify(
        dto.token,
        { secret: process.env.JWT_EMAIL_CHANGE_SECRET }
      );
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.pendingEmail !== payload.newEmail)
        throw new BadRequestException("Token yaroqsiz.");

      await this.prisma.user.update({
        where: { id: user.id },
        data: { email: payload.newEmail, pendingEmail: null },
      });
      return { message: "Email muvaffaqiyatli o‘zgartirildi." };
    } catch (e) {
      throw new BadRequestException("Token noto‘g‘ri yoki eskirgan.");
    }
  }

  async findUserProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { tasks: true, members: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findUserFavoriteTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { favoritedBy: { some: { id: userId } } },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  async findAllAdmins(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereCondition = {
      ...this.activeUserCondition,
      role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: this.userSelectFields,
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);
    return {
      data: users,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findAllOnlyUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const whereCondition = { ...this.activeUserCondition, role: Role.USER };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: this.userSelectFields,
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);
    return {
      data: users,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findUserFavoriteProjects(userId: string) {
    return this.prisma.project.findMany({
      where: {
        favoritedBy: {
          some: { id: userId },
        },
        // Foydalanuvchi hali ham a'zo bo'lgan loyihalarnigina ko'rsatish
        members: {
          some: { userId },
        },
      },
      select: {
        id: true,
        name: true,
        projectImageUrl: true,
        _count: { select: { tasks: true, members: true } },
      },
    });
  }
}
