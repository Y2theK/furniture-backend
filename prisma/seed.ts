import { PrismaClient, Prisma } from "@prisma/client";
import { genSalt, hash } from "bcrypt";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    phone: "777777777",
    password: "",
    randToken: "esadgfasdfaawer",
  },
  {
    phone: "777722779",
    password: "",
    randToken: "esadgfasdfaawer",
  },
  {
    phone: "777722772",
    password: "",
    randToken: "esadgfasdfaawer",
  },
];

async function main() {
  console.log("Start seeding...");
  const salt = await genSalt(10);
  for (const u of userData) {
    const password = await hash("asdfasdf", salt);
    u.password = password;
    await prisma.user.create({
      data: u,
    });
  }
  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
