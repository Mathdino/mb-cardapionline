"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Company } from "@/lib/types";

export async function getCompanies() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
    return companies;
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}

export async function getCompanyBySlug(slug: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { slug },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company by slug:", error);
    return null;
  }
}

export async function updateCompany(companyId: string, data: Partial<Company>) {
  try {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        description: data.description,
        whatsapp: data.whatsapp,
        minimumOrder: data.minimumOrder,
        profileImage: data.profileImage,
        bannerImage: data.bannerImage,
        phone: data.phone,
        address: data.address as any, // Prisma expects Json, but types define specific structure
        businessHours: data.businessHours as any,
        paymentMethods: data.paymentMethods,
      },
    });

    revalidatePath("/empresa/dashboard/informacoes");
    return { success: true, company: updatedCompany };
  } catch (error) {
    console.error("Error updating company:", error);
    return { success: false, error: "Failed to update company information" };
  }
}

export async function toggleRestaurantStatus(
  companyId: string,
  isOpen: boolean,
) {
  try {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { isOpen },
    });

    revalidatePath("/empresa/dashboard");
    revalidatePath(`/${updatedCompany.slug}`);

    return { success: true, company: updatedCompany };
  } catch (error) {
    console.error("Error toggling restaurant status:", error);
    return { success: false, error: "Failed to update restaurant status" };
  }
}
