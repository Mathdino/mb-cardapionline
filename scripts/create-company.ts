import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const slug = "minha-empresa";
  const email = "admin@empresa.com";
  const password = await hash("123456", 10);

  console.log("--- Iniciando criação de empresa ---");

  // 1. Limpar dados antigos para evitar conflitos
  try {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.company.deleteMany({ where: { slug } });
  } catch (e) {
    console.log(
      "Nenhum dado antigo para limpar ou erro na limpeza (pode ignorar if first run)",
    );
  }

  // 2. Criar a Empresa
  const company = await prisma.company.create({
    data: {
      name: "Minha Empresa Nova",
      slug: slug,
      description: "Descrição da minha nova empresa criada via script.",
      profileImage: "https://via.placeholder.com/150",
      bannerImage: "https://via.placeholder.com/800x200",
      phone: ["(11) 99999-9999"],
      whatsapp: "5511999999999",
      minimumOrder: 10.0,
      averagePreparationTime: 30,
      deliveryMethods: ["entrega", "retirada"],
      paymentMethods: ["cash", "pix", "credit"],
      isOpen: true,
      address: {
        cep: "01001-000",
        street: "Praça da Sé",
        number: "1",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
      },
      businessHours: [
        {
          dayOfWeek: 0,
          dayName: "Domingo",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
        {
          dayOfWeek: 1,
          dayName: "Segunda",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
        {
          dayOfWeek: 2,
          dayName: "Terça",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
        {
          dayOfWeek: 3,
          dayName: "Quarta",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
        {
          dayOfWeek: 4,
          dayName: "Quinta",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
        {
          dayOfWeek: 5,
          dayName: "Sexta",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
        {
          dayOfWeek: 6,
          dayName: "Sábado",
          openTime: "08:00",
          closeTime: "22:00",
          isOpen: true,
        },
      ],
    },
  });

  console.log(`✅ Empresa criada: ${company.name} (ID: ${company.id})`);

  // 3. Criar Usuário Admin vinculado a essa empresa
  const user = await prisma.user.create({
    data: {
      name: "Administrador",
      email: email,
      password: password,
      role: "company_owner",
      companyId: company.id,
    },
  });

  console.log(
    `✅ Usuário criado: ${user.email} (Vinculado à empresa: ${company.name})`,
  );
  console.log("--- Processo concluído com sucesso ---");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar empresa:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
