import { prisma } from '../../../lib/prisma';
import { broadcast } from '../../../lib/sse';

export async function POST(request) {
  try {
    const body = await request.json();
    const { idempotencyKey, type, providerIds } = body;

    if (!idempotencyKey || !type) {
      return Response.json({ error: 'idempotencyKey and type are required' }, { status: 400 });
    }

    // Check if this webhook event was already processed
    const existing = await prisma.webhookEvent.findUnique({
      where: { id: idempotencyKey },
    });

    if (existing) {
      return Response.json({
        success: true,
        idempotent: true,
        message: 'Webhook already processed — no duplicate action taken.',
        processedAt: existing.processedAt,
      });
    }

    let result = {};

    if (type === 'QUOTA_RESET') {
      // Reset quota for all providers (or specific ones)
      await prisma.$transaction(async (tx) => {
        // Record the webhook event first (idempotency)
        await tx.webhookEvent.create({
          data: {
            id: idempotencyKey,
            type,
            payload: body,
          },
        });

        if (providerIds && Array.isArray(providerIds) && providerIds.length > 0) {
          await tx.provider.updateMany({
            where: { id: { in: providerIds } },
            data: { leadsReceived: 0, monthlyQuota: 10 },
          });
        } else {
          // Reset all providers
          await tx.provider.updateMany({
            data: { leadsReceived: 0, monthlyQuota: 10 },
          });
        }

        // Also reset allocation state indices for fairness
        await tx.allocationState.updateMany({
          data: { nextIndex: 0 },
        });
      });

      result = { message: 'All provider quotas reset to 10' };

      // Broadcast update
      broadcast('quota-reset', { message: 'Provider quotas have been reset' });

    } else {
      return Response.json({ error: `Unknown webhook type: ${type}` }, { status: 400 });
    }

    return Response.json({
      success: true,
      idempotent: false,
      ...result,
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}