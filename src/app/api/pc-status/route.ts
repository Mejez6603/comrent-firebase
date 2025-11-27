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
  'pending_approval',
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
        return { ...pc, status: 'pending_payment', user: undefined, session_start: undefined, session_duration: undefined };
      }
    }
    
    // Randomly change status for a small percentage of available PCs
    if (pc.status === 'available' && Math.random() < 0.01) {
      const newStatus = 'in_use';
        return { 
          ...pc, 
          status: newStatus,
          user: `user_${Math.random().toString(36).substring(7)}`,
          session_start: new Date().toISOString(),
          session_duration: [30, 60, 120][Math.floor(Math.random() * 3)],
      };
    }

    return pc;
  });
}

export async function GET(request: Request) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
  
  const { searchParams } = new URL(request.url);
  const pcId = searchParams.get('id');

  updateStatuses();

  if (pcId) {
    const pc = pcs.find(p => p.id === pcId);
    if (pc) {
      return NextResponse.json(pc);
    }
    return NextResponse.json({ message: 'PC not found' }, { status: 404 });
  }

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

export async function PUT(request: Request) {
    try {
      const { id, newStatus, duration, user, email } = await request.json();
  
      if (!id || !newStatus) {
        return NextResponse.json({ message: 'Missing id or newStatus' }, { status: 400 });
      }
  
      const pcIndex = pcs.findIndex(p => p.id === id);
  
      if (pcIndex === -1) {
        return NextResponse.json({ message: 'PC not found' }, { status: 404 });
      }

      if (!statuses.includes(newStatus)) {
        return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
      }
  
      pcs[pcIndex].status = newStatus;

      if (newStatus === 'in_use') {
        pcs[pcIndex].session_start = new Date().toISOString();
        // If duration and user are not provided, it means admin is approving
        // so we should keep the existing ones if available.
        pcs[pcIndex].session_duration = duration || pcs[pcIndex].session_duration;
        pcs[pcIndex].user = user || pcs[pcIndex].user || `user_${Math.random().toString(36).substring(7)}`;

      } else if (newStatus === 'pending_approval') {
        // When a user sends a payment request
        pcs[pcIndex].user = user;
        pcs[pcIndex].email = email;
        pcs[pcIndex].session_duration = duration;
        pcs[pcIndex].session_start = undefined; // Clear start time until approved
      
      } else if (['available', 'maintenance', 'unavailable', 'pending_payment'].includes(newStatus)) {
        pcs[pcIndex].user = undefined;
        pcs[pcIndex].session_start = undefined;
        pcs[pcIndex].session_duration = undefined;
        pcs[pcIndex].email = undefined;
      }
  
      return NextResponse.json(pcs[pcIndex]);
    } catch (error) {
        console.error('API PUT Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
      const { id } = await request.json();
  
      if (!id) {
        return NextResponse.json({ message: 'Missing id' }, { status: 400 });
      }
  
      const pcIndex = pcs.findIndex(p => p.id === id);
  
      if (pcIndex === -1) {
        return NextResponse.json({ message: 'PC not found' }, { status: 404 });
      }
  
      const deletedPc = pcs.splice(pcIndex, 1);
  
      return NextResponse.json({ message: 'PC deleted successfully', deletedPcId: deletedPc[0].id });
    } catch (error) {
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
