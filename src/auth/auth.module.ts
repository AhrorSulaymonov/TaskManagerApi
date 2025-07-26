import { forwardRef, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../user/user.module";
import { PrismaModule } from "../prisma/prisma.module";
import {
  AccessTokenStrategy,
  RefreshTokenStrategy,
} from "../common/strategies";
import { MailModule } from "../mail/mail.module";
import { FileAmazonService } from "../file-amazon/file-amazon.service";

@Module({
  imports: [PrismaModule, forwardRef(() => UserModule), MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AuthModule {}
