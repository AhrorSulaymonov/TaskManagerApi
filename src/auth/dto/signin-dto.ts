import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignInDto {
  @ApiProperty({
    example: "johndoe@example.com",
    description: "Tizimga kirish uchun email yoki username",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({
    example: "Password123!",
    description: "Foydalanuvchi paroli (kamida 6 belgi)",
  })
  @IsString()
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
  })
  password: string;
}
