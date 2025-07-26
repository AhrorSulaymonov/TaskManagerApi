import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Xatolikni to'g'ri formatda logga yozish
    const errorMessage =
      exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(
      `Status: ${status} | Error: ${errorMessage}`,
      `${request.method} ${request.url}`
    );

    // Foydalanuvchiga qaytariladigan javobni xavfsiz tarzda shakllantirish
    let responseBody: object;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      // Agar javob shunchaki matn bo'lsa, uni { message: '...' } obyektiga o'rab beramiz
      responseBody =
        typeof exceptionResponse === "string"
          ? { message: exceptionResponse }
          : (exceptionResponse as object);
    } else {
      // Production muhitida ichki xatoliklar haqida ma'lumot chiqarmaymiz
      responseBody = {
        message: "Internal Server Error",
      };
    }

    response.status(status).json({
      statusCode: status,
      ...responseBody,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
