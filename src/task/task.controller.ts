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
  Query,
  BadRequestException,
} from "@nestjs/common";
import { TaskService } from "./task.service";
import { CreateTaskDto, UpdateTaskDto } from "./dto";
import { AccessTokenGuard } from "../common/guards";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Task")
@ApiBearerAuth("access-token")
@UseGuards(AccessTokenGuard)
@Controller("task") // Asosiy prefix /task bo'lib qoladi
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: "Yangi vazifa yaratish" })
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
    @Body() createTaskDto: CreateTaskDto,
    @GetCurrentUserId() userId: string,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.taskService.create(createTaskDto, userId, image);
  }

  @Get("by-project/:projectId")
  @ApiOperation({ summary: "Bir loyihadagi barcha vazifalarni olish" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
  })
  findAllByProject(
    @Param("projectId") projectId: string,
    @GetCurrentUserId() userId: string,
    @Query("status") status?: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) {
    return this.taskService.findAllByProject(projectId, userId, { status });
  }

  @Get(":id")
  @ApiOperation({ summary: "Bitta vazifani ID bo'yicha olish" })
  findOne(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.taskService.findOne(id, userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Vazifa ma'lumotlarini yangilash" })
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
    @Body() updateTaskDto: UpdateTaskDto,
    @GetCurrentUserId() userId: string,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.taskService.update(id, updateTaskDto, userId, image);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Vazifani o'chirish" })
  remove(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.taskService.remove(id, userId);
  }

  @Patch(":id/favorite")
  @ApiOperation({ summary: "Vazifani sevimlilarga qo'shish/olib tashlash" })
  toggleFavorite(
    @Param("id") taskId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.taskService.toggleFavorite(taskId, userId);
  }

  @Post(":taskId/tags/:tagId")
  @ApiOperation({ summary: "Vazifaga bitta teg qo'shish" })
  addTag(
    @Param("taskId") taskId: string,
    @Param("tagId") tagId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.taskService.addTagToTask(taskId, tagId, userId);
  }

  @Delete(":taskId/tags/:tagId")
  @ApiOperation({ summary: "Vazifadan bitta tegni olib tashlash" })
  removeTag(
    @Param("taskId") taskId: string,
    @Param("tagId") tagId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.taskService.removeTagFromTask(taskId, tagId, userId);
  }
}
