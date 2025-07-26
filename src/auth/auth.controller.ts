import {
  Controller,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  ForgotPasswordDto,
  ReactivateAccountDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
} from "./dto";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { CookieGetter } from "../common/decorators/cookie-getter.decorator";
import { Response } from "express";
import { AccessTokenGuard, RefreshTokenGuard } from "../common/guards";
import { Public } from "../common/decorators";
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Yangi foydalanuvchini ro'yxatdan o'tkazish" })
  @ApiResponse({
    status: 201,
    description: "Tasdiqlash havolasi emailingizga yuborildi.",
  })
  @ApiResponse({ status: 409, description: "Email allaqachon mavjud." })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Tizimga kirish va tokenlarni olish" })
  @ApiResponse({ status: 200, description: "Muvaffaqiyatli tizimga kirildi." })
  @ApiResponse({ status: 401, description: "Login yoki parol noto‘g‘ri." })
  @ApiResponse({
    status: 403,
    description: "Email tasdiqlanmagan yoki akkaunt faol emas.",
  })
  signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.signIn(signInDto, res);
  }

  @Public()
  @Post("request-reactivation")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Faolsizlantirilgan akkauntni qayta tiklash uchun so'rov yuborish",
  })
  requestReactivation(@Body() reactivateAccountDto: ReactivateAccountDto) {
    return this.authService.requestReactivation(reactivateAccountDto);
  }

  @Public()
  @Get("confirm-reactivation/:token") // GET, chunki foydalanuvchi emailidan linkni bosadi
  @ApiOperation({
    summary: "Email orqali akkauntni qayta tiklashni tasdiqlash",
  })
  confirmReactivation(@Param("token") token: string) {
    return this.authService.confirmReactivation(token);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Parolni tiklash uchun emailga xabar yuborish" })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post("reset-password/:token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Email orqali olingan token bilan yangi parol o'rnatish",
  })
  resetPassword(
    @Param("token") token: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    return this.authService.resetPassword(token, resetPasswordDto);
  }

  @Post("refresh")
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Access tokenni refresh token yordamida yangilash" })
  refresh(
    @GetCurrentUserId() userId: string,
    @CookieGetter("refresh_token") refreshToken: string,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.refreshToken(userId, refreshToken, res);
  }

  @Post("signout")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Tizimdan chiqish (logout)" })
  signOut(
    @GetCurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.signOut(userId, res);
  }
}
