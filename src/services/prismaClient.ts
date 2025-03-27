import { PrismaClient } from "@prisma/client";

export default new PrismaClient().$extends({
  result: {
    user: {
      fullname: {
        needs: { firstName: true, lastName: true },
        compute(user) {
          return `${user.firstName} ${user.lastName}`;
        },
      },
      image: {
        needs: { image: true },
        compute(user) {
          return user.image
            ? `/optimize/${user.image.split(".")[0]}.webp`
            : null;
        },
      },
    },
    post: {
      image: {
        needs: { image: true },
        compute(post) {
          return `/optimize/${post.image.split(".")[0]}.webp`;
        },
      },
      updatedAt: {
        needs: { updatedAt: true },
        compute(post) {
          return post.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
    },
  },
});
