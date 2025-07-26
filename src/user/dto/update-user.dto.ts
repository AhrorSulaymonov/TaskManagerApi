import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: "Jonathan",
    description: "Foydalanuvchining yangi ismi",
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: "Doer",
    description: "Foydalanuvchining yangi familiyasi",
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: "jonny",
    description: "Foydalanuvchining yangi unikal username'i",
  })
  @Transform(({ value }) => String(value).toLowerCase())
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    example: "+998901234567",
    description: "Foydalanuvchining yangi telefon raqami",
  })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: "Foydalanuvchi uchun yangi avatar (rasm)",
  })
  @IsOptional()
  image?: any;
}
