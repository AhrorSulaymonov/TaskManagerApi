import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { Observable } from "rxjs";

@Injectable()
export class JwtSelfGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    const userId = +req.user.id;
    const paramId = +req.params.id;
    const userRole = req.user.role;

    if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
      return true;
    }

    if (userId !== paramId) {
      throw new ForbiddenException({
        message: "Oka, sizda dostup yo‘q",
      });
    }

    return true;
  }
}
