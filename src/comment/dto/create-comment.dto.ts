import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({
    example: "Bu vazifani men o'z zimmamga olaman.",
    description: "Izoh matni",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: "cuid_of_the_task",
    description: "Izoh yozilayotgan vazifaning IDsi",
  })
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
