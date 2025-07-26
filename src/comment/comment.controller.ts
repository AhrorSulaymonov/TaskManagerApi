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
import { CommentService } from "./comment.service";
import { CreateCommentDto, UpdateCommentDto } from "./dto";
import { AccessTokenGuard } from "../common/guards";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Comment")
@ApiBearerAuth("access-token")
@UseGuards(AccessTokenGuard)
@Controller("comment")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: "Vazifaga yangi izoh qo'shish" })
  create(
    @Body() createCommentDto: CreateCommentDto,
    @GetCurrentUserId() userId: string
  ) {
    return this.commentService.create(createCommentDto, userId);
  }

  @Get("by-task/:taskId")
  @ApiOperation({ summary: "Bir vazifaga tegishli barcha izohlarni olish" })
  findAllByTask(
    @Param("taskId") taskId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.commentService.findAllByTask(taskId, userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Izohni tahrirlash (Faqat muallif uchun)" })
  update(
    @Param("id") id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetCurrentUserId() userId: string
  ) {
    return this.commentService.update(id, updateCommentDto, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Izohni o'chirish (Muallif yoki loyiha admini uchun)",
  })
  remove(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.commentService.remove(id, userId);
  }
}
