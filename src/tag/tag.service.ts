import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateTagDto, UpdateTagDto } from "./dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yangi teg yaratadi. Teg nomi unikal bo'lishi kerak.
   * @param dto - Teg ma'lumotlari (nomi va rangi)
   */
  async create(dto: CreateTagDto) {
    // Teg nomi bo'yicha unikalikni tekshirish
    const existingTag = await this.prisma.tag.findUnique({
      where: { name: dto.name },
    });

    if (existingTag) {
      throw new ConflictException(`'${dto.name}' nomli teg allaqachon mavjud.`);
    }

    return this.prisma.tag.create({
      data: {
        name: dto.name,
        color: dto.color,
      },
    });
  }

  /**
   * Barcha teglar ro'yxatini qaytaradi.
   */
  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: {
        name: "asc", // Alifbo tartibida
      },
    });
  }

  /**
   * Mavjud tegni ID bo'yicha tahrirlaydi.
   * @param id - Tahrirlanadigan tegning IDsi
   * @param dto - Yangi ma'lumotlar
   */
  async update(id: string, dto: UpdateTagDto) {
    // Teg mavjudligini tekshirish
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException("Teg topilmadi.");
    }

    // Agar nom o'zgartirilayotgan bo'lsa, yangi nom band emasligini tekshirish
    if (dto.name && dto.name !== tag.name) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { name: dto.name },
      });
      if (existingTag) {
        throw new ConflictException(
          `'${dto.name}' nomli teg allaqachon mavjud.`
        );
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Tegni ID bo'yicha o'chiradi.
   * @param id - O'chiriladigan tegning IDsi
   */
  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException("Teg topilmadi.");
    }

    // Prisma avtomatik ravishda bu tegni barcha vazifalardan uzib qo'yadi (_TaskTags jadvalidan)
    await this.prisma.tag.delete({
      where: { id },
    });
  }
}
