/**
 * Lead Distribution Engine
 *
 * Mandatory assignment rules:
 *   Service 1 → Provider 1 must always receive
 *   Service 2 → Provider 5 must always receive
 *   Service 3 → Provider 1 AND Provider 4 must always receive
 *
 * Fair pool for remaining slots (round-robin, persisted in DB):
 *   Service 1 → Providers 2, 3, 4
 *   Service 2 → Providers 6, 7, 8
 *   Service 3 → Providers 2, 3, 5, 6, 7, 8
 *
 * Each lead must be assigned to exactly 3 providers.
 * Providers cannot exceed monthly quota (10).
 */

//  THE MISSING OBJECTS DECLARED DIRECTLY:
export const MANDATORY_PROVIDERS = {
  'Service 1': ['Provider 1'],
  'Service 2': ['Provider 5'],
  'Service 3': ['Provider 1', 'Provider 4'],
};

export const FAIR_POOL_PROVIDERS = {
  'Service 1': ['Provider 2', 'Provider 3', 'Provider 4'],
  'Service 2': ['Provider 6', 'Provider 7', 'Provider 8'],
  'Service 3': ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'],
};

export const LEADS_PER_ASSIGNMENT = 3;

/**
 * Core allocation function — must be called inside a serialized transaction.
 *
 * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction client
 * @param {string} serviceName - Name of the service
 * @param {number} serviceId - ID of the service
 * @returns {Promise<number[]>} - Array of provider IDs to assign
 */
export async function allocateProviders(tx, serviceName, serviceId) {
  const mandatory = MANDATORY_PROVIDERS[serviceName] || [];
  const fairPool = FAIR_POOL_PROVIDERS[serviceName] || [];
  const slotsNeeded = LEADS_PER_ASSIGNMENT;

  // Fetch all providers from DB
  const allProviders = await tx.provider.findMany({
    orderBy: { id: 'asc' },
  });

  const providerByName = {};
  for (const p of allProviders) {
    providerByName[p.name] = p;
  }

  const assigned = [];
  const assignedNames = new Set();

  // Step 1: Assign mandatory providers who have available quota
  for (const name of mandatory) {
    const provider = providerByName[name];
    if (!provider) continue;
    if (provider.leadsReceived < provider.monthlyQuota) {
      assigned.push(provider.id);
      assignedNames.add(name);
    } else {
      console.warn(`Mandatory provider ${name} has hit quota. Skipping.`);
    }
  }

  // Step 2: Fill remaining slots fairly using sequential round-robin over the static pool list
  let remainingSlots = slotsNeeded - assigned.length;

  if (remainingSlots > 0 && fairPool.length > 0) {
    const state = await tx.allocationState.findUnique({
      where: { serviceId },
    });

    let currentIndex = state ? state.nextIndex : 0;
    let attempts = 0;
    const maxAttempts = fairPool.length;

    while (remainingSlots > 0 && attempts < maxAttempts) {
      const poolIdx = currentIndex % fairPool.length;
      const candidateName = fairPool[poolIdx];
      const provider = providerByName[candidateName];

      // Check if candidate is already processed via mandatory array assignment rule
      if (provider && assignedNames.has(candidateName)) {
        currentIndex++;
        attempts++;
        continue;
      }

      if (provider && provider.leadsReceived < provider.monthlyQuota) {
        assigned.push(provider.id);
        assignedNames.add(candidateName);
        remainingSlots--;
      }
      
      currentIndex++;
      attempts++;
    }

    // Persist the precise mathematical next step to the DB
    await tx.allocationState.upsert({
      where: { serviceId },
      update: { nextIndex: currentIndex },
      create: { serviceId, nextIndex: currentIndex },
    });
  }

  return assigned;
}