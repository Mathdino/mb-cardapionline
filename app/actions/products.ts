"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function createProduct(companyId: string, data: any) {
  try {
    const product = await prisma.product.create({
      data: {
        companyId,
        ...data,
      },
    });
    revalidatePath("/empresa/dashboard/produtos");
    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(id: string, companyId: string, data: any) {
  try {
    const existing = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied" };
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    revalidatePath("/empresa/dashboard/produtos");
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

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/empresa/dashboard/produtos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
