import { PrismaClient } from '@prisma/client';

// We hardcode your active pooler connection string right here to bypass any Vercel cache bugs
const SEED_URL = "postgresql://postgres.xusktvjxrehbkonqpltm:Aghori12345%23%23@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: SEED_URL, 
      },
    },
  });
};

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;