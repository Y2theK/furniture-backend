import { PrismaClient, Prisma } from "@prisma/client";
import { genSalt, hash } from "bcrypt";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

function createRandomUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: "international" }),
    randToken: faker.internet.jwt(),
    password: "",
  };
}

const userData = faker.helpers.multiple(createRandomUser, {
  count: 10, // number of users
});

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
