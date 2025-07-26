import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdateUserPasswordDto {
  @ApiProperty({
    example: "oldPassword123!",
    description: "Eski (joriy) parol",
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    example: "newStrongPassword456!",
    description: "Yangi parol (kamida 6 belgi)",
  })
  @IsString()
  @MinLength(6, {
    message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.",
  })
  newPassword: string;

  @ApiProperty({
    example: "newStrongPassword456!",
    description: "Yangi parolni tasdiqlash",
  })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
}
