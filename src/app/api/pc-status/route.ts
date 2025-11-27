import { NextResponse } from 'next/server';
import type { PC, PCStatus } from '@/lib/types';

// In-memory "database" to store PC states.
let pcs: PC[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  name: `PC-${String(i + 1).padStart(2, '0')}`,
  status: 'offline',
}));

const statuses: PCStatus[] = [
  'offline',
  'active',
  'warning',
  'pending_extension',
  'expired',
];

// Initialize with some varied statuses
pcs[1].status = 'active';
pcs[3].status = 'pending_extension';
pcs[5].status = 'expired';
pcs[7].status = 'active';

// Function to simulate real-time updates
function updateStatuses() {
  pcs = pcs.map(pc => {
    // Only change status for a small percentage of PCs on each call
    if (Math.random() < 0.1) {
      // Give a higher chance for PCs to become 'offline'
      const newStatus = Math.random() < 0.4 ? 'offline' : statuses[Math.floor(Math.random() * statuses.length)];
      return { ...pc, status: newStatus };
    }
    return pc;
  });
}

export async function GET() {
  // Simulate a random delay to mimic network latency
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
  
  updateStatuses();
  return NextResponse.json(pcs);
}

// This forces the route to be dynamic and not cached.
export const dynamic = 'force-dynamic';
