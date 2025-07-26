import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";

export class ReactivateAccountDto {
  @ApiProperty({
    example: "user@example.com",
    description:
      "Faolsizlantirilgan akkauntni qayta tiklash uchun email manzil",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsEmail({}, { message: "Iltimos, to'g'ri email manzil kiriting." })
  @IsNotEmpty({ message: "Email bo'sh bo'lishi mumkin emas." })
  email: string;
}
