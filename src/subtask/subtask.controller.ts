import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { SubtaskService } from "./subtask.service";
import { CreateSubtaskDto, UpdateSubtaskDto } from "./dto";
import { AccessTokenGuard } from "../common/guards";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Subtask")
@ApiBearerAuth("access-token")
@UseGuards(AccessTokenGuard)
@Controller("subtask")
export class SubtaskController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Post()
  @ApiOperation({ summary: "Asosiy vazifaga yangi kichik vazifa qo'shish" })
  create(
    @Body() createSubtaskDto: CreateSubtaskDto,
    @GetCurrentUserId() userId: string
  ) {
    return this.subtaskService.create(createSubtaskDto, userId);
  }

  @Get("by-task/:taskId")
  @ApiOperation({
    summary: "Bir vazifaga tegishli barcha kichik vazifalarni olish",
  })
  findAllByTask(
    @Param("taskId") taskId: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.subtaskService.findAllByTask(taskId, userId);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Kichik vazifani tahrirlash (nomini yoki bajarilganlik holatini)",
  })
  update(
    @Param("id") id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
    @GetCurrentUserId() userId: string
  ) {
    return this.subtaskService.update(id, updateSubtaskDto, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Kichik vazifani o'chirish (Asosiy vazifa muallifi yoki loyiha admini uchun)",
  })
  remove(@Param("id") id: string, @GetCurrentUserId() userId: string) {
    return this.subtaskService.remove(id, userId);
  }
}
