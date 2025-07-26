import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  UpdateUserRoleDto,
  RequestEmailChangeDto,
  ConfirmEmailChangeDto,
  AdminResetPasswordDto, // Yangi DTO
} from "./dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { AccessTokenGuard, RolesGuard } from "../common/guards";
import { GetCurrentUserId } from "../common/decorators/get-current-user-id.decorator";
import { Roles } from "../common/decorators/roles-auth.decorator";
import { Role } from "@prisma/client";
import { Public } from "../common/decorators";

@ApiTags("User")
@ApiBearerAuth("access-token")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  // =================================================================
  // ==                SELF-SERVICE ROUTES (/me)                    ==
  // =================================================================

  @Get("me")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Joriy foydalanuvchi profilini olish" })
  findMe(@GetCurrentUserId() userId: string) {
    return this.userService.findOneById(userId);
  }

  @Patch("me")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Joriy foydalanuvchi profilini yangilash" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UpdateUserDto })
  @UseInterceptors(
    FileInterceptor("image", {
      fileFilter: (req, file, callback) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const isValidExt = allowedTypes.test(file.originalname.toLowerCase());
        const isValidMime = allowedTypes.test(file.mimetype);
        if (isValidExt && isValidMime) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              "Faqat JPG, JPEG, PNG yoki GIF yuklash mumkin!"
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // Maksimal fayl hajmi: 2MB
      },
    })
  )
  updateMe(
    @GetCurrentUserId() userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.userService.updateProfile(userId, updateUserDto, image);
  }

  @Delete("me")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Joriy foydalanuvchi akkauntini faolsizlantirish (Soft Delete)",
  })
  deactivateMe(@GetCurrentUserId() userId: string) {
    return this.userService.deactivateUser(userId);
  }

  @Patch("me/password")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Foydalanuvchi o‘z parolini yangilash" })
  @ApiBody({ type: UpdateUserPasswordDto })
  updateOwnPassword(
    @GetCurrentUserId() userId: string,
    @Body() updatePasswordDto: UpdateUserPasswordDto
  ) {
    return this.userService.updateOwnPassword(userId, updatePasswordDto);
  }

  @Patch("me/email")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Email o‘zgartirishni so‘rash (link yuboriladi)" })
  async requestEmailChange(
    @GetCurrentUserId() userId: string,
    @Body() dto: RequestEmailChangeDto
  ) {
    return this.userService.requestEmailChange(userId, dto);
  }

  @Get("me/projects")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Men a'zo bo'lgan barcha loyihalarni olish" })
  getMyProjects(@GetCurrentUserId() userId: string) {
    return this.userService.findUserProjects(userId);
  }

  @Get("me/favorite-tasks")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Mening sevimli vazifalarim ro'yxatini olish" })
  getMyFavoriteTasks(@GetCurrentUserId() userId: string) {
    return this.userService.findUserFavoriteTasks(userId);
  }

  @Get("me/favorite-projects")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "Mening sevimli loyihalarim ro'yxatini olish" })
  getMyFavoriteProjects(@GetCurrentUserId() userId: string) {
    return this.userService.findUserFavoriteProjects(userId);
  }

  // =================================================================
  // ==                   PUBLIC ROUTES                             ==
  // =================================================================

  @Public()
  @Get("activate/:link")
  @ApiSecurity({})
  @ApiOperation({ summary: "Email orqali akkauntni aktivlashtirish" })
  activate(@Param("link") link: string) {
    return this.userService.activate(link);
  }

  @Public()
  @Post("confirm-email-change")
  @ApiSecurity({})
  @ApiOperation({ summary: "Email o‘zgarishini tasdiqlash (link orqali)" })
  async confirmEmailChange(@Body() dto: ConfirmEmailChangeDto) {
    return this.userService.confirmEmailChange(dto);
  }

  // =================================================================
  // ==                   ADMIN ROUTES                              ==
  // =================================================================

  @Get("admins")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Barcha faol adminlar va super-adminlarni olish" })
  findAllAdmins(@Query("page") page = "1", @Query("limit") limit = "10") {
    return this.userService.findAllAdmins(+page, +limit);
  }

  @Get("users")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Barcha faol oddiy foydalanuvchilarni olish" })
  findAllOnlyUsers(@Query("page") page = "1", @Query("limit") limit = "10") {
    return this.userService.findAllOnlyUsers(+page, +limit);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Yangi foydalanuvchi yaratish (Admin)" })
  @ApiBody({ type: CreateUserDto })
  create(
    @Body() createUserDto: CreateUserDto,
    @GetCurrentUserId() adminId: string
  ) {
    return this.userService.createUserByAdmin(createUserDto, adminId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Barcha faol foydalanuvchilarni olish (Admin)" })
  findAll(@Query("page") page = "1", @Query("limit") limit = "10") {
    return this.userService.findAllActiveUsers(+page, +limit);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Foydalanuvchini ID bo'yicha olish (Admin)" })
  findOne(@Param("id") id: string) {
    return this.userService.findOneById(id);
  }

  @Patch(":id/reset-password")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Foydalanuvchi parolini majburiy tiklash (Admin)" })
  @ApiBody({ type: AdminResetPasswordDto })
  resetPasswordByAdmin(
    @Param("id") id: string,
    @Body() resetPasswordDto: AdminResetPasswordDto
  ) {
    return this.userService.resetPasswordByAdmin(id, resetPasswordDto);
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @ApiOperation({ summary: "Foydalanuvchi global rolini yangilash (Admin)" })
  @ApiBody({ type: UpdateUserRoleDto })
  updateRole(
    @Param("id") id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto
  ) {
    return this.userService.updateRole(id, updateUserRoleDto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Foydalanuvchini faolsizlantirish (Admin)" })
  deactivateUserByAdmin(@Param("id") id: string) {
    return this.userService.deactivateUser(id);
  }
}
