import { NextResponse } from 'next/server';
import type { PC, PCStatus } from '@/lib/types';

let pcs: PC[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  name: `PC-${String(i + 1).padStart(2, '0')}`,
  status: 'available',
}));

const statuses: PCStatus[] = [
  'available',
  'in_use',
  'pending_payment',
  'maintenance',
  'unavailable',
];

// Initial realistic statuses
pcs[1].status = 'in_use';
pcs[1].user = 'user_a';
pcs[1].session_start = new Date(Date.now() - 30 * 60 * 1000).toISOString();
pcs[1].session_duration = 60;

pcs[3].status = 'pending_payment';

pcs[5].status = 'maintenance';

pcs[7].status = 'in_use';
pcs[7].user = 'user_b';
pcs[7].session_start = new Date(Date.now() - 15 * 60 * 1000).toISOString();
pcs[7].session_duration = 30;

pcs[10].status = 'unavailable';


function updateStatuses() {
  pcs = pcs.map(pc => {
    // Simulate session ending for 'in_use' PCs
    if (pc.status === 'in_use' && pc.session_start && pc.session_duration) {
      const endTime = new Date(pc.session_start).getTime() + pc.session_duration * 60 * 1000;
      if (Date.now() > endTime) {
        return { ...pc, status: 'available', user: undefined, session_start: undefined, session_duration: undefined };
      }
    }

    // Randomly change status for a small percentage of available PCs
    if (pc.status === 'available' && Math.random() < 0.05) {
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      if (newStatus === 'in_use') {
         return { 
            ...pc, 
            status: 'in_use',
            user: `user_${Math.random().toString(36).substring(7)}`,
            session_start: new Date().toISOString(),
            session_duration: [30, 60, 120][Math.floor(Math.random() * 3)],
        };
      }
      return { ...pc, status: newStatus };
    }

    return pc;
  });
}

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
  
  updateStatuses();
  return NextResponse.json(pcs);
}

export async function POST(request: Request) {
    try {
      const { id, newName } = await request.json();
  
      if (!id || !newName) {
        return NextResponse.json({ message: 'Missing id or newName' }, { status: 400 });
      }
  
      const pcIndex = pcs.findIndex(p => p.id === id);
  
      if (pcIndex === -1) {
        return NextResponse.json({ message: 'PC not found' }, { status: 404 });
      }
  
      pcs[pcIndex].name = newName;
  
      return NextResponse.json(pcs[pcIndex]);
    } catch (error) {
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
