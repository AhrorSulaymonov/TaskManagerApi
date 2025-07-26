import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding jarayoni boshlandi...");

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLocaleLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error(
      "Iltimos, .env faylida SUPER_ADMIN_EMAIL va SUPER_ADMIN_PASSWORD ni aniqlang"
    );
  }

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existingSuperAdmin) {
    console.log("Super admin allaqachon mavjud. Seeding o‘tkazib yuborildi.");
    return;
  }

  const passwordHash = await bcrypt.hash(superAdminPassword, 7);

  await prisma.user.create({
    data: {
      firstName: "Super",
      lastName: "Admin",
      email: superAdminEmail,
      passwordHash: passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
  });

  console.log("Super admin muvaffaqiyatli yaratildi!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
