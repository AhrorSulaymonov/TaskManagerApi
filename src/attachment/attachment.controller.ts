import {
  Controller,
  Post,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { AccessTokenGuard } from "../common/guards";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";

@ApiTags("Attachment")
@ApiBearerAuth("access-token")
@UseGuards(AccessTokenGuard)
@Controller("attachment")
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post("task/:taskId")
  @ApiOperation({ summary: "Vazifaga yangi fayl biriktirish" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateAttachmentDto }) // Swagger uchun DTO
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        // Xavfsizlik uchun ruxsat etilgan fayl turlarini aniq belgilaymiz
        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/pdf",
          "application/msword", // .doc
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
          "application/vnd.ms-excel", // .xls
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
          "text/plain", // .txt
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              "Bu turdagi fayllarni yuklash mumkin emas."
            ),
            false
          );
        }
      },
    })
  )
  uploadAttachment(
    @Param("taskId") taskId: string,
    @GetCurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("Yuklash uchun fayl tanlanmadi.");
    }
    return this.attachmentService.create(taskId, userId, file);
  }

  @Get("by-task/:taskId")
  @ApiOperation({
    summary: "Bir vazifaga tegishli barcha biriktirilgan fayllarni olish",
  })
  findAllByTask(
    @Param("taskId") taskId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.attachmentService.findAllByTask(taskId, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Biriktirilgan faylni o'chirish" })
  remove(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.attachmentService.remove(id, userId);
  }
}
