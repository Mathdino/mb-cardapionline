-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "deliveryMethods" TEXT[];

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" TEXT;
