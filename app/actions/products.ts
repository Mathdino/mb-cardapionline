"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getProducts(companyId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { companyId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getStoreProducts(companyId: string) {
  try {
    const now = new Date();
    const products = await prisma.product.findMany({
      where: { companyId },
      include: {
        category: true,
        promotions: {
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return products.map((item) => {
      // Extract promotions to avoid returning it if not in type,
      // but we need to access it first.
      const { promotions, ...product } = item;
      const activePromotion = promotions && promotions[0];

      if (activePromotion) {
        return {
          ...product,
          isPromotion: true,
          promotionalPrice: activePromotion.promotionalPrice,
        };
      }
      return product;
    });
  } catch (error) {
    console.error("Error fetching store products:", error);
    return [];
  }
}

export async function createProduct(companyId: string, data: any) {
  try {
    console.log("Creating product with data:", JSON.stringify(data, null, 2));
    const processedData = { ...data };
    if (processedData.flavors === null) processedData.flavors = Prisma.DbNull;
    if (processedData.comboConfig === null)
      processedData.comboConfig = Prisma.DbNull;

    const product = await prisma.product.create({
      data: {
        companyId,
        ...processedData,
      },
    });
    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProduct(id: string, companyId: string, data: any) {
  try {
    console.log("Updating product with data:", JSON.stringify(data, null, 2));
    const existing = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied" };
    }

    const processedData = { ...data };
    if (processedData.flavors === null) processedData.flavors = Prisma.DbNull;
    if (processedData.comboConfig === null)
      processedData.comboConfig = Prisma.DbNull;

    // Filter out undefined values to ensure Prisma only updates fields that are actually present
    // This fixes issues where undefined values might override existing data or cause errors
    const cleanData: any = {};
    Object.keys(processedData).forEach((key) => {
      if (processedData[key] !== undefined) {
        cleanData[key] = processedData[key];
      }
    });

    const product = await prisma.product.update({
      where: { id },
      data: cleanData,
    });

    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true, product };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(id: string, companyId: string) {
  try {
    const existing = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied" };
    }

    // Delete related promotions first to avoid foreign key constraint violations
    await prisma.promotion.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
