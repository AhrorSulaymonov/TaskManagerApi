import { ApiProperty } from "@nestjs/swagger";
import { IsJWT, IsNotEmpty } from "class-validator";

export class ConfirmEmailChangeDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Emailga yuborilgan, yangi emailni tasdiqlovchi JWT tokeni",
  })
  @IsJWT({ message: "Token yaroqli JWT formatida bo‘lishi kerak." })
  @IsNotEmpty({ message: "Tasdiqlash tokeni bo‘sh bo‘lishi mumkin emas." })
  token: string;
}
