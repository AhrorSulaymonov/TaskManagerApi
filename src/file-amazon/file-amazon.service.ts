import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand, // <-- O'chirish uchun import
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Unikal nom uchun import

dotenv.config();

@Injectable()
export class FileAmazonService {
  private AWS_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
  private s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException("Yuklash uchun fayl topilmadi.");
    }

    const fileExtension = file.originalname.split(".").pop();
    const uniqueKey = `${uuidv4()}.${fileExtension}`;

    const uploadParams = {
      Bucket: this.AWS_S3_BUCKET,
      Key: uniqueKey, // <-- Unikal nom ishlatilmoqda
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      return `https://${this.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw new InternalServerErrorException(
        "Faylni S3'ga yuklashda xatolik ro'y berdi."
      );
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      return;
    }

    try {
      const key = new URL(fileUrl).pathname.substring(1);

      const deleteParams = {
        Bucket: this.AWS_S3_BUCKET,
        Key: key,
      };

      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      console.error("S3 Delete Error:", error);
    }
  }
}
