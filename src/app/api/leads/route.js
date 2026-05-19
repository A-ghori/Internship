// Change these lines:
export const dynamic = 'force-dynamic';
import { prisma } from '../../../lib/prisma';
import { allocateProviders } from '../../../lib/allocation';
import { broadcast } from '../../../lib/sse';
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, city, serviceId, description } = body;

    if (!name || !phone || !city || !serviceId || !description) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate phone format
    const phoneClean = String(phone).trim();
    if (!/^\d{10}$/.test(phoneClean)) {
      return Response.json({ error: 'Phone must be a 10-digit number' }, { status: 400 });
    }

    const svcId = parseInt(serviceId, 10);

    // Use a serialized transaction with SERIALIZABLE isolation to handle concurrency
    const result = await prisma.$transaction(async (tx) => {
      // Check service exists
      const service = await tx.service.findUnique({ where: { id: svcId } });
      if (!service) throw new Error('Invalid service');

      // Check duplicate: same phone + same service
      const existing = await tx.lead.findUnique({
        where: { phone_serviceId: { phone: phoneClean, serviceId: svcId } },
      });
      if (existing) {
        throw Object.assign(new Error('Duplicate: this phone has already submitted a lead for this service.'), { status: 409 });
      }

      // Allocate providers (round-robin + mandatory)
      const providerIds = await allocateProviders(tx, service.name, svcId);

      if (providerIds.length === 0) {
        throw new Error('No providers available for this service at the moment.');
      }

      // Create the lead
      const lead = await tx.lead.create({
        data: {
          name: name.trim(),
          phone: phoneClean,
          city: city.trim(),
          description: description.trim(),
          serviceId: svcId,
        },
      });

      // Create assignments and increment provider counters
      for (const providerId of providerIds) {
        await tx.leadAssignment.create({
          data: { leadId: lead.id, providerId },
        });
        await tx.provider.update({
          where: { id: providerId },
          data: { leadsReceived: { increment: 1 } },
        });
      }

      // Fetch assignments for response
      const assignments = await tx.leadAssignment.findMany({
        where: { leadId: lead.id },
        include: { provider: true },
      });

      return { lead, assignments, service };
    }, {
      isolationLevel: 'Serializable',
      timeout: 15000,
    });

    // Broadcast real-time update to all dashboard clients
    broadcast('lead-assigned', {
      leadId: result.lead.id,
      service: result.service.name,
      assignedProviders: result.assignments.map((a) => ({
        id: a.provider.id,
        name: a.provider.name,
      })),
      createdAt: result.lead.createdAt,
    });

    return Response.json({
      success: true,
      lead: result.lead,
      assignedProviders: result.assignments.map((a) => a.provider.name),
    }, { status: 201 });

  } catch (err) {
    console.error('Lead creation error:', err);
    if (err.status === 409 || err.message.startsWith('Duplicate')) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    if (err.code === 'P2002') {
      return Response.json({ error: 'Duplicate: this phone has already submitted a lead for this service.' }, { status: 409 });
    }
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const leads = await prisma.lead.findMany({
    include: {
      service: true,
      assignments: { include: { provider: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(leads);
}