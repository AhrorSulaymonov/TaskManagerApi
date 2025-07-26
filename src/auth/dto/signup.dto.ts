import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class SignUpDto {
  @ApiProperty({ example: "John", description: "Foydalanuvchining ismi" })
  @IsString({ message: "Ism satr bo'lishi kerak." })
  @IsNotEmpty({ message: "Ism bo'sh bo'lishi mumkin emas." })
  firstName: string;

  @ApiProperty({ example: "Doe", description: "Foydalanuvchining familiyasi" })
  @IsString({ message: "Familiya satr bo'lishi kerak." })
  @IsNotEmpty({ message: "Familiya bo'sh bo'lishi mumkin emas." })
  lastName: string;

  @ApiPropertyOptional({
    example: "johndoe",
    description: "Foydalanuvchining unikal username'i (ixtiyoriy)",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    example: "johndoe@example.com",
    description: "Foydalanuvchining unikal email manzili",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsEmail({}, { message: "Iltimos, to'g'ri email manzil kiriting." })
  @IsNotEmpty({ message: "Email bo'sh bo'lishi mumkin emas." })
  email: string;

  @ApiProperty({
    example: "Password123!",
    description:
      "Parol (kamida 6 belgi, katta/kichik harflar va raqam bo'lishi shart)",
  })
  @IsString()
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak.",
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message:
      "Parol kamida bitta katta harf, bitta kichik harf va bitta raqamdan iborat bo‘lishi kerak.",
  })
  password: string;

  @ApiProperty({ example: "Password123!", description: "Parolni tasdiqlash" })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
