import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    example: "NewPassword123!",
    description: "Yangi parol (kamida 6 belgi)",
  })
  @IsString()
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
  })
  password: string;

  @ApiProperty({
    example: "NewPassword123!",
    description: "Yangi parolni tasdiqlash",
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}