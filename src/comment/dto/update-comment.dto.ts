import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateCommentDto {
  @ApiProperty({
    example: "Yangilangan izoh matni.",
    description: "Izoh matni",
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
