import prisma from "./prismaClient";

export type ProductArgs = {
  name: string;
  description: string;
  price: string;
  discount: string;
  inventory: number;
  category: string;
  type: string;
  tags: string[];
  images: string[];
};
export const createOneProduct = async (productData: ProductArgs) => {
  const data: any = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    discount: productData.discount,
    inventory: productData.inventory,
    category: {
      connectOrCreate: {
        where: {
          name: productData.category,
        },
        create: {
          name: productData.category,
        },
      },
    },
    type: {
      connectOrCreate: {
        where: {
          name: productData.type,
        },
        create: {
          name: productData.type,
        },
      },
    },
    images: {
      create: productData.images,
    },
  };

  if (productData.tags && productData.tags.length > 0) {
    data.tags = {
      connectOrCreate: productData.tags.map((tag) => ({
        where: {
          name: tag,
        },
        create: {
          name: tag,
        },
      })),
    };
  }

  return prisma.product.create({
    data,
  });
};

export const getProductById = async (id: number) => {
  return prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      images: true,
    },
  });
};

export const getProductWithRelation = async (id: number) => {
  return prisma.product.findUnique({
    where: {
      id,
    },
    omit: {
      // omit is for excluding fields
      createdAt: true,
      updatedAt: true,
      typeId: true,
      categoryId: true,
    },
    include: {
      images: {
        select: {
          id: true,
          path: true,
        },
      },
    },
    // select: {
    //   id: true,
    //   name: true,
    //   description: true,
    //   price: true,
    //   updatedAt: true,
    //   category: {
    //     select: {
    //       name: true,
    //     },
    //   },
    //   type: {
    //     select: {
    //       name: true,
    //     },
    //   },
    //   tags: {
    //     select: {
    //       name: true,
    //     },
    //   },
    //   images: {
    //     select: {
    //       path: true,
    //     },
    //   },
    // },
  });
};

export const deleteOneProduct = async (id: number) => {
  return prisma.product.delete({
    where: {
      id, // id: id
    },
  });
};

export const updateOneProduct = async (id: number, productData: any) => {
  const data: any = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    category: {
      connectOrCreate: {
        where: {
          name: productData.category,
        },
        create: {
          name: productData.category,
        },
      },
    },
    type: {
      connectOrCreate: {
        where: {
          name: productData.type,
        },
        create: {
          name: productData.type,
        },
      },
    },
  };

  if (productData.tags && productData.tags.length > 0) {
    data.tags = {
      set: [],
      connectOrCreate: productData.tags.map((tag: string) => ({
        where: {
          name: tag,
        },
        create: {
          name: tag,
        },
      })),
    };
  }
  if (productData.images && productData.images.length > 0) {
    data.images = {
      deleteMany: {},
      create: productData.images,
    };
  }
  return prisma.product.update({
    where: { id },
    data: data,
  });
};

export const getProductLists = async (options: any) => {
  return prisma.product.findMany(options);
};
