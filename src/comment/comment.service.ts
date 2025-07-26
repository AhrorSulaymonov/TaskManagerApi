import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CreateCommentDto, UpdateCommentDto } from "./dto";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectRole } from "@prisma/client";

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto, userId: string) {
    const { taskId, content } = dto;

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) {
      throw new NotFoundException("Vazifa topilmadi.");
    }

    await this.checkProjectMembership(task.projectId, userId);

    return this.prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarImageUrl: true,
          },
        },
      },
    });
  }

  async findAllByTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) {
      throw new NotFoundException("Vazifa topilmadi.");
    }

    await this.checkProjectMembership(task.projectId, userId);

    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarImageUrl: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException("Izoh topilmadi.");
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        "Siz faqat o'zingizning izohingizni tahrirlay olasiz."
      );
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarImageUrl: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { task: { select: { projectId: true } } },
    });
    if (!comment) {
      throw new NotFoundException("Izoh topilmadi.");
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId: comment.task.projectId },
      },
    });

    const isAuthor = comment.authorId === userId;
    const isProjectAdminOrOwner =
      membership?.role === ProjectRole.ADMIN ||
      membership?.role === ProjectRole.OWNER;

    if (!isAuthor && !isProjectAdminOrOwner) {
      throw new ForbiddenException(
        "Sizda bu izohni o'chirish uchun ruxsat yo'q."
      );
    }

    await this.prisma.comment.delete({ where: { id } });
  }

  private async checkProjectMembership(projectId: string, userId: string) {
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
        "Siz bu loyihaga a'zo bo'lmaganingiz uchun bu amalni bajara olmaysiz."
      );
    }
    return membership;
  }
}
