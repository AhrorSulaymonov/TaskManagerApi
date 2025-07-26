import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FileAmazonService } from "../file-amazon/file-amazon.service";
import { ProjectRole, TaskStatus } from "@prisma/client";
import { CreateTaskDto, UpdateTaskDto } from "./dto";

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileAmazonService
  ) {}

  async create(
    dto: CreateTaskDto,
    userId: string,
    image?: Express.Multer.File
  ) {
    const { projectId, tagIds, ...taskData } = dto;

    await this.checkPermission(projectId, userId);

    let taskImageUrl: string | undefined;
    if (image) {
      taskImageUrl = await this.fileService.uploadFile(image);
    }

    return this.prisma.task.create({
      data: {
        ...taskData,
        taskImageUrl,
        author: { connect: { id: userId } },
        project: { connect: { id: projectId } },
        tags: {
          connect: tagIds?.map((id) => ({ id })) || [],
        },
      },
    });
  }

  async findAllByProject(
    projectId: string,
    userId: string,
    filters: { status?: TaskStatus }
  ) {
    await this.checkPermission(projectId, userId);

    return this.prisma.task.findMany({
      where: {
        projectId,
        status: filters.status,
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, firstName: true, avatarImageUrl: true } },
        tags: true,
        _count: { select: { comments: true, subtasks: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
        tags: true,
        comments: {
          include: { author: { select: { id: true, firstName: true } } },
        },
        subtasks: true,
        attachments: true,
      },
    });

    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkPermission(task.project.id, userId);

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    userId: string,
    image?: Express.Multer.File
  ) {
    const { tagIds, ...taskData } = dto;
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkPermission(
      task.projectId,
      userId,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
      task.authorId
    );

    let taskImageUrl: string | undefined;
    if (image) {
      if (task.taskImageUrl) {
        await this.fileService.deleteFile(task.taskImageUrl);
      }
      taskImageUrl = await this.fileService.uploadFile(image);
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        ...(taskImageUrl !== undefined && { taskImageUrl }),
        tags: {
          set: tagIds?.map((id) => ({ id })),
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { attachments: true },
    });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkPermission(
      task.projectId,
      userId,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
      task.authorId
    );

    const filesToDelete: string[] = [];
    if (task.taskImageUrl) {
      filesToDelete.push(task.taskImageUrl);
    }
    task.attachments.forEach((attachment) => {
      filesToDelete.push(attachment.fileUrl);
    });

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map((url) => this.fileService.deleteFile(url))
      );
    }

    await this.prisma.task.delete({ where: { id } });
  }

  async toggleFavorite(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkPermission(task.projectId, userId);

    const isAlreadyFavorite = await this.prisma.user.findFirst({
      where: { id: userId, favoriteTasks: { some: { id: taskId } } },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        favoriteTasks: {
          [isAlreadyFavorite ? "disconnect" : "connect"]: { id: taskId },
        },
      },
    });

    return {
      message: `Vazifa muvaffaqiyatli ${isAlreadyFavorite ? "sevimlilardan olib tashlandi" : "sevimlilarga qo'shildi"}.`,
    };
  }

  async addTagToTask(taskId: string, tagId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkPermission(
      task.projectId,
      userId,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
      task.authorId
    );

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
      include: { tags: true },
    });
  }

  async removeTagFromTask(taskId: string, tagId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkPermission(
      task.projectId,
      userId,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
      task.authorId
    );

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
      include: { tags: true },
    });
  }

  private async checkPermission(
    projectId: string,
    userId: string,
    allowedRoles?: ProjectRole[],
    taskAuthorId?: string
  ) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!membership) {
      throw new ForbiddenException("Siz bu loyihaga a'zo emassiz.");
    }

    if (taskAuthorId && taskAuthorId === userId) {
      return;
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        "Sizda bu amalni bajarish uchun yetarli ruxsat yo'q."
      );
    }
  }
}
