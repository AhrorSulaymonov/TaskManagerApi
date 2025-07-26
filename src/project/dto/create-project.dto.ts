import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProjectDto {
  @ApiProperty({
    example: "Yangi veb-sayt qurish",
    description: "Loyihaning nomi",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: "Mijoz uchun korporativ veb-sayt yaratish",
    description: "Loyiha haqida batafsil ma'lumot",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: "Loyiha uchun muqova rasmi (ixtiyoriy, max 2MB)",
  })
  @IsOptional()
  image?: any;
}
