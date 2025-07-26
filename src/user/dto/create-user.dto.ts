import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsPhoneNumber,
  IsEnum,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "Jane", description: "Foydalanuvchining ismi" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: "Smith",
    description: "Foydalanuvchining familiyasi",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: "janesmith@example.com",
    description: "Foydalanuvchining email manzili",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "DefaultPass123!",
    description: "Boshlang'ich parol (kamida 6 belgi)",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
  })
  password: string;

  @ApiProperty({
    example: "DefaultPass123!",
    description: "Boshlang'ich parolni tasdiqlash",
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.USER,
    description: "Foydalanuvchi roli",
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    example: "janesmith",
    description: "Foydalanuvchining ixtiyoriy username'i",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    example: "+998912345678",
    description: "Foydalanuvchining telefon raqami (ixtiyoriy)",
  })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;
}
