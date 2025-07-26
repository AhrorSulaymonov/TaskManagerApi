import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateTaskDto {
  @ApiProperty({
    example: "Autentifikatsiya modulini yaratish",
    description: "Vazifaning sarlavhasi",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: "JWT va Passport.js yordamida...",
    description: "Vazifaning batafsil tavsifi",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "cuid_of_the_project",
    description: "Vazifa tegishli bo'lgan loyihaning IDsi",
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    example: ["cuid_of_tag1", "cuid_of_tag2"],
    description: "Vazifaga biriktiriladigan teglar IDlari",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({
    example: "2025-12-31T23:59:59.000Z",
    description: "Vazifani topshirishning oxirgi muddati",
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: "Vazifaga biriktirilgan rasm",
  })
  @IsOptional()
  image?: any;
}
