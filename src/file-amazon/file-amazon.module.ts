import { Module } from "@nestjs/common";
import { FileAmazonService } from "./file-amazon.service";

@Module({
  providers: [FileAmazonService],
  exports: [FileAmazonService],
})
export class FileAmazonModule {}
