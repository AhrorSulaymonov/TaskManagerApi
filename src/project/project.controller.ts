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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { ProjectService } from "./project.service";
import { AccessTokenGuard } from "../common/guards";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  AddProjectMemberDto,
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from "./dto";

@ApiTags("Project")
@ApiBearerAuth("access-token")
@UseGuards(AccessTokenGuard)
@Controller("project")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: "Yangi loyiha yaratish" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("image", {
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const isValidExt = allowedTypes.test(file.originalname.toLowerCase());
        const isValidMime = allowedTypes.test(file.mimetype);
        if (isValidExt && isValidMime) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              "Faqat JPG, JPEG, PNG yoki GIF yuklash mumkin!"
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // Maksimal fayl hajmi: 2MB
      },
    })
  )
  create(
    @Body() createProjectDto: CreateProjectDto,
    @GetCurrentUserId() userId: string,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.projectService.create(createProjectDto, userId, image);
  }

  @Get()
  @ApiOperation({ summary: "Men a'zo bo'lgan barcha loyihalarni olish" })
  findAll(@GetCurrentUserId() userId: string) {
    return this.projectService.findAllForUser(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Bitta loyihani ID bo'yicha olish" })
  findOne(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.projectService.findOne(id, userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Loyiha ma'lumotlarini yangilash" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("image", {
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const isValidExt = allowedTypes.test(file.originalname.toLowerCase());
        const isValidMime = allowedTypes.test(file.mimetype);
        if (isValidExt && isValidMime) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              "Faqat JPG, JPEG, PNG yoki GIF yuklash mumkin!"
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // Maksimal fayl hajmi: 2MB
      },
    })
  )
  update(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetCurrentUserId() userId: string,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.projectService.update(id, updateProjectDto, userId, image);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Loyihani o'chirish (Faqat egasi)" })
  remove(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.projectService.remove(id, userId);
  }

  // --- A'zolarni Boshqarish ---

  @Post(":id/members")
  @ApiOperation({ summary: "Loyihaga yangi a'zo qo'shish" })
  addMember(
    @Param("id") projectId: string,
    @Body() addMemberDto: AddProjectMemberDto,
    @GetCurrentUserId() currentUserId: string
  ) {
    return this.projectService.addMember(
      projectId,
      addMemberDto,
      currentUserId
    );
  }

  @Get(":id/members")
  @ApiOperation({ summary: "Loyiha a'zolari ro'yxatini olish" })
  getMembers(
    @Param("id") projectId: string,
    @GetCurrentUserId() currentUserId: string
  ) {
    return this.projectService.getProjectMembers(projectId, currentUserId);
  }

  @Patch(":id/members/:memberUserId")
  @ApiOperation({ summary: "Loyiha a'zosining rolini o'zgartirish" })
  updateMemberRole(
    @Param("id") projectId: string,
    @Param("memberUserId") memberUserId: string,
    @Body() updateDto: UpdateProjectMemberDto,
    @GetCurrentUserId() currentUserId: string
  ) {
    return this.projectService.updateMemberRole(
      projectId,
      memberUserId,
      updateDto.role,
      currentUserId
    );
  }

  @Delete(":id/members/:memberUserId")
  @ApiOperation({ summary: "Loyihadan a'zoni o'chirish" })
  removeMember(
    @Param("id") projectId: string,
    @Param("memberUserId") memberUserId: string,
    @GetCurrentUserId() currentUserId: string
  ) {
    return this.projectService.removeMember(
      projectId,
      memberUserId,
      currentUserId
    );
  }

  @Patch(":id/favorite")
  @ApiOperation({ summary: "Loyihani sevimlilarga qo'shish/olib tashlash" })
  toggleFavorite(
    @Param("id") projectId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.projectService.toggleFavorite(projectId, userId);
  }
}
