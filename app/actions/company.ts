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
    console.log("=== UPDATE COMPANY DEBUG ===");
    console.log("ID received:", companyId);
    console.log("Data keys:", Object.keys(data));

    if (!companyId) {
      throw new Error("ID da empresa é obrigatório para atualização.");
    }

    // Filter and clean data
    const cleanData: any = {};
    const allowedFields = [
      "name",
      "description",
      "whatsapp",
      "minimumOrder",
      "profileImage",
      "bannerImage",
      "phone",
      "address",
      "businessHours",
      "paymentMethods",
      "averagePreparationTime",
      "instagram",
      "facebook",
      "segment",
      "pizzaBorders",
      "deliveryMethods",
      "isOpen",
    ];

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key) && data[key as keyof typeof data] !== undefined) {
        cleanData[key] = data[key as keyof typeof data];
      }
    });

    // Special handling for Json fields if they are null
    if (cleanData.pizzaBorders === null) cleanData.pizzaBorders = [];

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: cleanData,
    });

    console.log("Update successful for company:", updatedCompany.slug);

    revalidatePath("/empresa/dashboard/informacoes");
    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath(`/${updatedCompany.slug}`);
    
    // Ensure serializability by converting to plain object
    return JSON.parse(JSON.stringify({ success: true, company: updatedCompany }));
  } catch (error) {
    console.error("Error updating company:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar informações da empresa",
    };
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
