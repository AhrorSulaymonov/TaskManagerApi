import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FileAmazonService } from "../file-amazon/file-amazon.service"; // Yoki sizning fayl servisingiz
import { ProjectRole } from "@prisma/client";
import { AddProjectMemberDto, CreateProjectDto, UpdateProjectDto } from "./dto";

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileAmazonService
  ) {}

  async create(
    dto: CreateProjectDto,
    userId: string,
    image?: Express.Multer.File
  ) {
    let projectImageUrl: string | undefined;
    if (image) {
      projectImageUrl = await this.fileService.uploadFile(image);
    }

    // Tranzaksiya: Loyiha va uning egasini bir vaqtda yaratish
    const newProject = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        projectImageUrl,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: ProjectRole.OWNER, // Yaratuvchi avtomatik ravishda OWNER bo'ladi
          },
        },
      },
    });

    return newProject;
  }

  async findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarImageUrl: true,
              },
            },
          },
        },
        tasks: true,
      },
    });

    if (!project) throw new NotFoundException("Loyiha topilmadi.");

    const isMember = project.members.some((member) => member.userId === userId);
    if (!isMember)
      throw new ForbiddenException("Siz bu loyihaga a'zo emassiz.");

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
    image?: Express.Multer.File
  ) {
    await this.checkPermission(id, userId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("Loyiha topilmadi.");

    let projectImageUrl: string | undefined;
    if (image) {
      if (project.projectImageUrl) {
        await this.fileService.deleteFile(project.projectImageUrl);
      }
      projectImageUrl = await this.fileService.uploadFile(image);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(projectImageUrl !== undefined && { projectImageUrl }), // Agar rasm o'chirilgan bo'lsa null bo'lishi ham mumkin
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.checkPermission(id, userId, [ProjectRole.OWNER]);

    const projectToDelete = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!projectToDelete) throw new NotFoundException("Loyiha topilmadi.");

    const filesToDelete: string[] = [];
    if (projectToDelete.projectImageUrl) {
      filesToDelete.push(projectToDelete.projectImageUrl);
    }

    projectToDelete.tasks.forEach((task) => {
      if (task.taskImageUrl) {
        filesToDelete.push(task.taskImageUrl);
      }
      task.attachments.forEach((attachment) => {
        filesToDelete.push(attachment.fileUrl);
      });
    });

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map((url) => this.fileService.deleteFile(url))
      );
    }

    await this.prisma.project.delete({ where: { id } });
  }

  // --- A'zolarni Boshqarish ---

  async addMember(
    projectId: string,
    dto: AddProjectMemberDto,
    currentUserId: string
  ) {
    await this.checkPermission(projectId, currentUserId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const isAlreadyMember = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: dto.userId, projectId } },
    });
    if (isAlreadyMember)
      throw new ConflictException("Bu foydalanuvchi allaqachon loyiha a'zosi.");

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async getProjectMembers(projectId: string, currentUserId: string) {
    await this.checkPermission(projectId, currentUserId); // Har qanday a'zo ko'rishi mumkin
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarImageUrl: true,
          },
        },
      },
    });
  }

  async updateMemberRole(
    projectId: string,
    memberUserId: string,
    newRole: ProjectRole,
    currentUserId: string
  ) {
    const currentUserMembership = await this.checkPermission(
      projectId,
      currentUserId,
      [ProjectRole.OWNER, ProjectRole.ADMIN]
    );

    const targetMembership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: memberUserId, projectId } },
    });
    if (!targetMembership)
      throw new NotFoundException(
        "O'zgartiriladigan a'zo bu loyihada topilmadi."
      );

    if (targetMembership.role === ProjectRole.OWNER) {
      throw new ForbiddenException(
        "Loyiha egasining rolini o'zgartirib bo'lmaydi."
      );
    }
    if (
      currentUserMembership.role === ProjectRole.ADMIN &&
      targetMembership.role === ProjectRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Admin boshqa adminning rolini o'zgartira olmaydi."
      );
    }

    return this.prisma.projectMember.update({
      where: { userId_projectId: { userId: memberUserId, projectId } },
      data: { role: newRole },
    });
  }

  async removeMember(
    projectId: string,
    memberUserId: string,
    currentUserId: string
  ) {
    const currentUserMembership = await this.checkPermission(
      projectId,
      currentUserId,
      [ProjectRole.OWNER, ProjectRole.ADMIN]
    );

    if (memberUserId === currentUserId) {
      throw new BadRequestException("O'zingizni loyihadan o'chira olmaysiz.");
    }

    const targetMembership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: memberUserId, projectId } },
    });
    if (!targetMembership)
      throw new NotFoundException("O'chiriladigan a'zo bu loyihada topilmadi.");

    if (targetMembership.role === ProjectRole.OWNER) {
      throw new ForbiddenException("Loyiha egasini o'chirib bo'lmaydi.");
    }
    if (
      currentUserMembership.role === ProjectRole.ADMIN &&
      targetMembership.role === ProjectRole.ADMIN
    ) {
      throw new ForbiddenException("Admin boshqa adminni o'chira olmaydi.");
    }

    await this.prisma.projectMember.delete({
      where: { userId_projectId: { userId: memberUserId, projectId } },
    });
    return { message: "A'zo loyihadan muvaffaqiyatli o'chirildi." };
  }

  async toggleFavorite(projectId: string, userId: string) {
    await this.checkPermission(projectId, userId);

    const isAlreadyFavorite = await this.prisma.user.findFirst({
      where: {
        id: userId,
        favoriteProjects: {
          some: { id: projectId },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        favoriteProjects: {
          [isAlreadyFavorite ? "disconnect" : "connect"]: { id: projectId },
        },
      },
    });

    return {
      message: `Loyiha muvaffaqiyatli ${
        isAlreadyFavorite
          ? "sevimlilardan olib tashlandi"
          : "sevimlilarga qo'shildi"
      }.`,
    };
  }

  private async checkPermission(
    projectId: string,
    userId: string,
    allowedRoles?: ProjectRole[]
  ) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "Siz bu loyihaga a'zo emassiz yoki loyiha mavjud emas."
      );
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        "Sizda bu amalni bajarish uchun ruxsat yo'q."
      );
    }

    return membership;
  }
}
