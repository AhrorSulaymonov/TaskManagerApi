import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RequestEmailChangeDto {
  @ApiProperty({
    example: "new.john.doe@example.com",
    description: "O‘zgartiriladigan yangi email manzil",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsEmail({}, { message: "Iltimos, yaroqli email manzil kiriting." })
  @IsNotEmpty({ message: "Yangi email manzili bo‘sh bo‘lishi mumkin emas." })
  newEmail: string;

  @ApiProperty({
    example: "MyCurrentPassword123!",
    description: "Jarayonni tasdiqlash uchun joriy parol",
  })
  @IsString({ message: "Parol satr bo‘lishi kerak." })
  @IsNotEmpty({ message: "Joriy parol bo‘sh bo‘lishi mumkin emas." })
  currentPassword: string;
}
