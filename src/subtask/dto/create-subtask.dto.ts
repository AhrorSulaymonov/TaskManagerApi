import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSubtaskDto {
  @ApiProperty({
    example: "Login endpointini yaratish",
    description: "Kichik vazifa sarlavhasi",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: "cuid_of_the_main_task",
    description: "Asosiy vazifaning IDsi",
  })
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
