import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateTagDto {
  @ApiProperty({ example: "Frontend", description: "Yangi teg nomi" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "#3498DB", description: "Teg rangi (HEX formatida)" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#([0-9A-F]{3}){1,2}$/i, {
    message: "Rang yaroqli HEX kod bo'lishi kerak.",
  })
  color: string;
}
