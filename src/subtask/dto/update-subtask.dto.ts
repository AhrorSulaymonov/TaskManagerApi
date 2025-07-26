import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateSubtaskDto {
  @ApiPropertyOptional({
    example: "Login endpointini testlash",
    description: "Kichik vazifaning yangi sarlavhasi",
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Kichik vazifaning bajarilganlik statusi",
  })
  @IsBoolean()
  @IsOptional()
  isComplete?: boolean;
}
