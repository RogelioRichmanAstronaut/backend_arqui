/*
  Warnings:

  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReservationState" AS ENUM ('PENDIENTE', 'APROBADA', 'DENEGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('PENDIENTE', 'APROBADA', 'DENEGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "BookingState" AS ENUM ('PENDIENTE', 'APROBADA', 'DENEGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CartItemKind" AS ENUM ('HOTEL', 'AIR');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('PENDING_PAYMENT', 'FAILED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
ALTER COLUMN "name" SET NOT NULL;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "state" "ReservationState" NOT NULL DEFAULT 'PENDIENTE',
    "currency" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "paymentAttemptExtId" TEXT,
    "idempotencyKey" TEXT,
    "state" "PaymentState" NOT NULL DEFAULT 'PENDIENTE',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentAttemptId" TEXT NOT NULL,
    "state" "PaymentState" NOT NULL,
    "authCode" TEXT,
    "receiptRef" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "transactionAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "state" "PaymentState" NOT NULL,
    "refundedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelSupplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotelSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirlineSupplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirlineSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reservationId" TEXT,
    "clientId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "propertyCode" TEXT NOT NULL,
    "roomTypeCode" TEXT NOT NULL,
    "ratePlanCode" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "state" "BookingState" NOT NULL DEFAULT 'PENDIENTE',
    "extBookingId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightBooking" (
    "id" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "reservationId" TEXT,
    "clientId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "state" "BookingState" NOT NULL DEFAULT 'PENDIENTE',
    "extBookingId" TEXT,
    "segments" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "kind" "CartItemKind" NOT NULL,
    "refId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "state" "OrderState" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "reservationId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" "CartItemKind" NOT NULL,
    "refId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientId_key" ON "Client"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationId_key" ON "Reservation"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_paymentAttemptExtId_key" ON "PaymentAttempt"("paymentAttemptExtId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionId_key" ON "Transaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundId_key" ON "Refund"("refundId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelSupplier_code_key" ON "HotelSupplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AirlineSupplier_code_key" ON "AirlineSupplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HotelBooking_bookingId_key" ON "HotelBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelBooking_idempotencyKey_key" ON "HotelBooking"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "FlightBooking_pnr_key" ON "FlightBooking"("pnr");

-- CreateIndex
CREATE UNIQUE INDEX "FlightBooking_idempotencyKey_key" ON "FlightBooking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Cart_clientId_idx" ON "Cart"("clientId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBooking" ADD CONSTRAINT "HotelBooking_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBooking" ADD CONSTRAINT "HotelBooking_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "HotelSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "AirlineSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
