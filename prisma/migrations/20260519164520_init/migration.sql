-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyQuota" INTEGER NOT NULL DEFAULT 10,
    "leadsReceived" INTEGER NOT NULL DEFAULT 0,
    "allocationIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignments" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_states" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "nextIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "allocation_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leads_phone_serviceId_key" ON "leads"("phone", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_assignments_leadId_providerId_key" ON "lead_assignments"("leadId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_states_serviceId_key" ON "allocation_states"("serviceId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
