import { prisma } from '../../../lib/prisma';

export async function GET() {
  const providers = await prisma.provider.findMany({
    include: {
      leadAssignments: {
        include: {
          lead: {
            include: { service: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
    orderBy: { id: 'asc' },
  });

  return Response.json(providers);
}