"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  details?: string;
}

interface CreateOrderData {
  companyId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  notes?: string;
}

export async function createOrder(data: CreateOrderData) {
  try {
    const {
      companyId,
      customerName,
      customerPhone,
      items,
      total,
      paymentMethod,
      notes,
    } = data;

    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return { success: false, error: "Company not found" };
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        companyId,
        customerName,
        customerPhone,
        items: items as any, // Prisma handles JSON
        total,
        status: "pending",
        paymentMethod,
        notes: notes || "",
      },
    });

    // Revalidate dashboard
    revalidatePath("/empresa/dashboard");

    return { success: true, order };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Failed to create order" };
  }
}
