import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FileAmazonService } from "../file-amazon/file-amazon.service";
import { ProjectRole } from "@prisma/client";

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileAmazonService
  ) {}

  async create(taskId: string, userId: string, file: Express.Multer.File) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkProjectMembership(task.projectId, userId);

    const fileUrl = await this.fileService.uploadFile(file);

    return this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl,
        taskId,
      },
    });
  }

  async findAllByTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException("Vazifa topilmadi.");

    await this.checkProjectMembership(task.projectId, userId);

    return this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async remove(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            projectId: true,
            authorId: true,
          },
        },
      },
    });
    if (!attachment)
      throw new NotFoundException("Biriktirilgan fayl topilmadi.");

    const membership = await this.checkProjectMembership(
      attachment.task.projectId,
      userId
    );

    const isAuthor = attachment.task.authorId === userId;
    const isProjectAdminOrOwner =
      membership.role === ProjectRole.ADMIN ||
      membership.role === ProjectRole.OWNER;

    if (!isAuthor && !isProjectAdminOrOwner) {
      throw new ForbiddenException(
        "Sizda bu faylni o'chirish uchun ruxsat yo'q."
      );
    }

    await this.fileService.deleteFile(attachment.fileUrl);

    await this.prisma.attachment.delete({ where: { id } });
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
