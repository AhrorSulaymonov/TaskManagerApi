import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class AddProjectMemberDto {
  @ApiProperty({
    example: "user_cuid_to_add",
    description: "Loyihaga qo'shiladigan foydalanuvchining IDsi",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.MEMBER,
    description: "Foydalanuvchining loyihadagi roli",
  })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}

export class UpdateProjectMemberDto {
  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.ADMIN,
    description: "Foydalanuvchining loyihadagi yangi roli",
  })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}
