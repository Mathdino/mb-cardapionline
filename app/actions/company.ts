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

export async function getCompanyById(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company by id:", error);
    return null;
  }
}

export async function updateCompany(companyId: string, data: Partial<Company>) {
  try {
    console.log("Updating company:", companyId, data);
    // Filter out undefined values to ensure Prisma only updates fields that are actually present
    const cleanData: any = {};

    if (data.name !== undefined) cleanData.name = data.name;
    if (data.description !== undefined)
      cleanData.description = data.description;
    if (data.whatsapp !== undefined) cleanData.whatsapp = data.whatsapp;
    if (data.minimumOrder !== undefined)
      cleanData.minimumOrder = data.minimumOrder;
    if (data.profileImage !== undefined)
      cleanData.profileImage = data.profileImage;
    if (data.bannerImage !== undefined)
      cleanData.bannerImage = data.bannerImage;
    if (data.phone !== undefined) cleanData.phone = data.phone;
    if (data.address !== undefined) cleanData.address = data.address;
    if (data.businessHours !== undefined)
      cleanData.businessHours = data.businessHours;
    if (data.paymentMethods !== undefined)
      cleanData.paymentMethods = data.paymentMethods;
    if (data.averagePreparationTime !== undefined)
      cleanData.averagePreparationTime = data.averagePreparationTime;
    if (data.instagram !== undefined) cleanData.instagram = data.instagram;
    if (data.facebook !== undefined) cleanData.facebook = data.facebook;

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: cleanData,
    });

    revalidatePath("/empresa/dashboard/informacoes");
    revalidatePath(`/${updatedCompany.slug}`); // Also revalidate the public page
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
