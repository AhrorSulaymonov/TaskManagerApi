import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEnum, IsNotEmpty } from "class-validator";

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: Role,
    example: Role.ADMIN,
    description: "Foydalanuvchiga tayinlanadigan yangi global rol",
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
