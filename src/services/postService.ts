import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type PostArgs = {
  title: string;
  content: string;
  body: string;
  image: string;
  category: string;
  type: string;
  tags: string[];
  authorId: number;
};
export const createOnePost = async (postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    image: postData.image,
    author: {
      connect: {
        id: postData.authorId,
      },
    },
    category: {
      connectOrCreate: {
        where: {
          name: postData.category,
        },
        create: {
          name: postData.category,
        },
      },
    },
    type: {
      connectOrCreate: {
        where: {
          name: postData.type,
        },
        create: {
          name: postData.type,
        },
      },
    },
  };

  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tag) => ({
        where: {
          name: tag,
        },
        create: {
          name: tag,
        },
      })),
    };
  }

  return prisma.post.create({
    data,
  });
};

export const getPostById = async (id: number) => {
  return prisma.post.findUnique({
    where: {
      id,
    },
  });
};

export const deleteOnePost = async (id: number) => {
  return prisma.post.delete({
    where: {
      id, // id: id
    },
  });
};

export const updateOnePost = async (id: number, postData: any) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    category: {
      connectOrCreate: {
        where: {
          name: postData.category,
        },
        create: {
          name: postData.category,
        },
      },
    },
    type: {
      connectOrCreate: {
        where: {
          name: postData.type,
        },
        create: {
          name: postData.type,
        },
      },
    },
  };

  if (postData.image) {
    data.image = postData.image;
  }
  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tag: string) => ({
        where: {
          name: tag,
        },
        create: {
          name: tag,
        },
      })),
    };
  }
  return prisma.post.update({
    where: { id },
    data: data,
  });
};
