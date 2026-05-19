import { PrismaClient } from '@prisma/client';

const POOLER_NEON_URL = "postgresql://neondb_owner:npg_Ht4hcUT5gzvO@ep-morning-wind-ap1ranvc-pooler.c-7.us-east-1.aws.neon.tech:6543/neondb?sslmode=require&channel_binding=require";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: POOLER_NEON_URL,
      },
    },
  });
};

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;