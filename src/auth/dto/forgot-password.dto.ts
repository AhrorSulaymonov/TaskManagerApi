import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({
    example: "johndoe@example.com",
    description: "Parolni tiklash uchun foydalanuvchining email manzili",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsEmail({}, { message: "Iltimos, to'g'ri email manzil kiriting." })
  @IsNotEmpty({ message: "Email bo'sh bo'lishi mumkin emas." })
  email: string;
}

