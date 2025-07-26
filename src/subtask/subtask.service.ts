import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CreateSubtaskDto, UpdateSubtaskDto } from "./dto";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectRole } from "@prisma/client";

@Injectable()
export class SubtaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubtaskDto, userId: string) {
    const { taskId, title } = dto;

    const mainTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!mainTask) throw new NotFoundException("Asosiy vazifa topilmadi.");

    await this.checkProjectMembership(mainTask.projectId, userId);

    return this.prisma.subtask.create({
      data: {
        title,
        taskId,
      },
    });
  }

  async findAllByTask(taskId: string, userId: string) {
    const mainTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!mainTask) throw new NotFoundException("Asosiy vazifa topilmadi.");

    await this.checkProjectMembership(mainTask.projectId, userId);

    return this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: { id: "asc" }, // Yaratilish tartibida
    });
  }

  async update(id: string, dto: UpdateSubtaskDto, userId: string) {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id },
      include: { task: { select: { projectId: true } } },
    });
    if (!subtask) throw new NotFoundException("Kichik vazifa topilmadi.");

    await this.checkProjectMembership(subtask.task.projectId, userId);

    return this.prisma.subtask.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id },
      include: { task: { select: { authorId: true, projectId: true } } },
    });
    if (!subtask) throw new NotFoundException("Kichik vazifa topilmadi.");

    const membership = await this.checkProjectMembership(
      subtask.task.projectId,
      userId
    );

    const isAuthor = subtask.task.authorId === userId;
    const isProjectAdminOrOwner =
      membership.role === ProjectRole.ADMIN ||
      membership.role === ProjectRole.OWNER;

    if (!isAuthor && !isProjectAdminOrOwner) {
      throw new ForbiddenException(
        "Sizda bu kichik vazifani o'chirish uchun ruxsat yo'q."
      );
    }

    await this.prisma.subtask.delete({ where: { id } });
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
