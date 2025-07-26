import { ApiProperty } from "@nestjs/swagger";

export class CreateAttachmentDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Vazifaga biriktiriladigan fayl (max 2MB)",
  })
  file: any;
}
