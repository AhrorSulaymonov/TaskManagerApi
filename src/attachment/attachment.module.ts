import { Module } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { AttachmentController } from "./attachment.controller";
import { FileAmazonService } from "../file-amazon/file-amazon.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AttachmentController],
  providers: [AttachmentService, FileAmazonService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
