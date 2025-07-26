import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class AdminResetPasswordDto {
  @ApiProperty({
    example: "AdminSetNewPass123!",
    description: "Foydalanuvchi uchun yangi parol (kamida 6 belgi)",
  })
  @IsString()
  @MinLength(6, {
    message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.",
  })
  newPassword: string;

  @ApiProperty({
    example: "AdminSetNewPass123!",
    description: "Yangi parolni tasdiqlash",
  })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
}
