'use server';
import { NextResponse } from 'next/server';

export interface Message {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
  pcName: string; 
  isRead: boolean;
}

// In-memory store for messages, grouped by pcName
let messagesByPc = new Map<string, Message[]>();

// GET messages for a specific PC
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pcName = searchParams.get('pcName');
  
  if (!pcName) {
    return NextResponse.json({ message: 'pcName is required' }, { status: 400 });
  }

  const messages = messagesByPc.get(pcName) || [];
  return NextResponse.json(messages);
}

// POST a new message
export async function POST(request: Request) {
  try {
    const { pcName, sender, text } = await request.json();

    if (!pcName || !sender || !text) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      pcName,
      sender,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    
    const currentMessages = messagesByPc.get(pcName) || [];
    currentMessages.push(newMessage);
    messagesByPc.set(pcName, currentMessages);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT to mark messages as read
export async function PUT(request: Request) {
    try {
        const { pcName } = await request.json();
        if (!pcName) {
            return NextResponse.json({ message: 'pcName is required' }, { status: 400 });
        }

        const messages = messagesByPc.get(pcName);
        if (messages) {
            const updatedMessages = messages.map(msg => ({ ...msg, isRead: true }));
            messagesByPc.set(pcName, updatedMessages);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message PUT error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function DELETE() {
    // Test-only endpoint to clear messages
    if (process.env.NODE_ENV !== 'production') {
        messagesByPc.clear();
        return NextResponse.json({ message: 'All messages cleared' });
    }
    return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
}


export const dynamic = 'force-dynamic';
