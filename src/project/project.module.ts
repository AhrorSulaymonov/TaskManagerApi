import { Module } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { FileAmazonService } from "../file-amazon/file-amazon.service";

@Module({
  imports: [PrismaModule],
  controllers: [ProjectController],
  providers: [ProjectService, FileAmazonService],
})
export class ProjectModule {}
