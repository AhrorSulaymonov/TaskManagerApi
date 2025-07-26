import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TagService } from "./tag.service";
import { CreateTagDto, UpdateTagDto } from "./dto";
import { AccessTokenGuard, RolesGuard } from "../common/guards";
import { Roles } from "../common/decorators/roles-auth.decorator";
import { Role } from "@prisma/client";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Tag")
@ApiBearerAuth("access-token")
@UseGuards(AccessTokenGuard)
@Controller("tag")
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) // Faqat Adminlar teg yaratishi mumkin
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Yangi teg yaratish (Faqat Adminlar uchun)" })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Barcha mavjud teglar ro'yxatini olish" })
  findAll() {
    return this.tagService.findAll();
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) // Faqat Adminlar tegni o'zgartirishi mumkin
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Tegni tahrirlash (Faqat Adminlar uchun)" })
  update(@Param("id") id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN) // Faqat Adminlar tegni o'chirishi mumkin
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Tegni o'chirish (Faqat Adminlar uchun)" })
  remove(@Param("id") id: string) {
    return this.tagService.remove(id);
  }
}
