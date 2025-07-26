import { forwardRef, Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { FileAmazonService } from "../file-amazon/file-amazon.service";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, MailModule, forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService, FileAmazonService],
  exports: [UserService],
})
export class UserModule {}
