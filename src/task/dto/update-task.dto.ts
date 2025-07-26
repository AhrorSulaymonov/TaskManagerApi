import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";
import { TaskStatus } from "@prisma/client";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    description: "Vazifaning yangi statusi",
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
