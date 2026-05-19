import { prisma } from '../../../lib/prisma';
import { allocateProviders } from '../../../lib/allocation';
import { broadcast } from '../../../lib/sse';

// Helper function to retry transactions on serializable write conflicts
async function executeTransactionWithRetry(txFunc, maxRetries = 5, delay = 50) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(txFunc, {
        isolationLevel: 'Serializable',
        timeout: 15000,
      });
    } catch (error) {
      // Look for PostgreSQL Serializable conflict error codes (40001) or Prisma deadlock codes (P2034)
      const isConflict = error.code === 'P2034' || error.message?.includes('conflict') || error.message?.includes('deadlock');
      
      if (isConflict && attempt < maxRetries) {
        // Wait a small randomized period before retrying to let the other thread finish
        const backoff = delay * attempt + Math.floor(Math.random() * 50);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw error; // If it's another error or we ran out of retries, throw it
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'GENERATE_CONCURRENCY_LEADS') {
      const totalLeadsToMock = 10;
      const creationPromises = [];

      for (let i = 1; i <= totalLeadsToMock; i++) {
        const randomInt = Math.floor(100000 + Math.random() * 900000);
        const uniquePhone = `99${randomInt}01`;
        const chosenServiceId = (i % 3) + 1;

        const mockLeadPromise = (async () => {
          try {
            return await executeTransactionWithRetry(async (tx) => {
              const service = await tx.service.findUnique({ where: { id: chosenServiceId } });
              
              const existing = await tx.lead.findUnique({
                where: { phone_serviceId: { phone: uniquePhone, serviceId: chosenServiceId } }
              });
              if (existing) return null;

              const providerIds = await allocateProviders(tx, service.name, chosenServiceId);
              if (providerIds.length === 0) return null;

              const lead = await tx.lead.create({
                data: {
                  name: `Concurrent Test User ${i}`,
                  phone: uniquePhone,
                  city: 'Test City',
                  description: 'Automated concurrency and performance stress-test run.',
                  serviceId: chosenServiceId,
                },
              });

              for (const pId of providerIds) {
                await tx.leadAssignment.create({ data: { leadId: lead.id, providerId: pId } });
                await tx.provider.update({
                  where: { id: pId },
                  data: { leadsReceived: { increment: 1 } },
                });
              }
              return lead;
            });
          } catch (e) {
            console.error(`❌ Batch slot ${i} failed completely after retries:`, e.message);
            return null;
          }
        })();

        creationPromises.push(mockLeadPromise);
      }

      await Promise.all(creationPromises);

      // Notify frontend streams to completely refresh their metrics
      broadcast('lead-assigned', { message: 'Bulk concurrent leads completed.' });

      return Response.json({ success: true, message: 'Fired 10 simultaneous leads successfully!' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Bulk generation module failure:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}