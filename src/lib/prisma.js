import { PrismaClient } from '@prisma/client';

// We fall back to the direct port 5432 string since it already bypasses the tenant formatting checks perfectly
const ABSOLUTE_URL = "postgresql://postgres:Aghori12345%23%23@db.xusktvjxrehbkonqpltm.supabase.co:5432/postgres";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: ABSOLUTE_URL,
      },
    },
  });
};

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;