/**
 * @fileOverview API route for handling chat messages.
 *
 * This file defines the API endpoints for getting, creating, updating (marking as read),
 * and deleting chat messages. It uses an in-memory Map to store messages, grouped by PC name.
 *
 * - GET: Retrieves messages for a specific PC.
 * - POST: Adds a new message to a conversation.
 * - PUT: Marks all messages for a PC as read.
 * - DELETE: Clears all messages (for testing purposes).
 */

import { NextResponse } from 'next/server';

export interface Message {
  id: string;
  sender: 'user' | 'admin';
  text?: string; // Text is now optional
  imageUrl?: string; // Image URL is now an option
  timestamp: string;
  pcName: string; 
  isRead: boolean;
}

// In-memory store for messages, grouped by pcName
export let messagesByPc = new Map<string, Message[]>();

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
    const { pcName, sender, text, imageUrl } = await request.json();

    if (!pcName || !sender || (!text && !imageUrl)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      pcName,
      sender,
      text,
      imageUrl,
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


export async function DELETE(request: Request) {
    // Test-only endpoint to clear messages
    if (process.env.NODE_ENV !== 'production') {
        messagesByPc.clear();
        return NextResponse.json({ message: 'All messages cleared' });
    }
    return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
}


export const dynamic = 'force-dynamic';
