import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
  async sendMail(user: User) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: "Email tasdiqlash",
      template: "./confirm", // templates/confirm.hbs bo‘lishi kerak
      context: {
        name: user.firstName,
        url: `${process.env.BACKEND_URL || "http://localhost:3000/api"}/user/activate/${user.verificationCode}`,
      },
    });
  }

  async sendResetPasswordEmail(email: string, link: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Parolni tiklash",
      html: `<p>Parolingizni tiklash uchun quyidagi havolani bosing:</p><a href="${link}">${link}</a>`,
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      html,
    });
  }
}
