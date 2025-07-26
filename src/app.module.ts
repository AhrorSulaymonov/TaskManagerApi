import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "./user/user.module";
import { FileAmazonModule } from "./file-amazon/file-amazon.module";
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';
import { ProjectModule } from './project/project.module';
import { TagModule } from './tag/tag.module';
import { CommentModule } from './comment/comment.module';
import { SubtaskModule } from './subtask/subtask.module';
import { AttachmentModule } from './attachment/attachment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    JwtModule.register({ global: true }),
    UserModule,
    FileAmazonModule,
    AuthModule,
    TaskModule,
    ProjectModule,
    TagModule,
    CommentModule,
    SubtaskModule,
    AttachmentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
