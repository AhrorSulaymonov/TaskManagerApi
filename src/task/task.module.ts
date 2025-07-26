import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { FileAmazonService } from "../file-amazon/file-amazon.service";

@Module({
  imports: [PrismaModule],
  controllers: [TaskController],
  providers: [TaskService, FileAmazonService],
  exports: [TaskService],
})
export class TaskModule {}
