/**
 * @fileOverview API route for fetching all chat messages.
 *
 * This file defines an API endpoint for an admin to retrieve all active chat conversations.
 * It accesses the in-memory message store from the main messages route.
 *
 * - GET: Retrieves all messages for all PCs.
 */

import { NextResponse } from 'next/server';
import { messagesByPc } from '@/app/api/messages/route';

// GET all messages for all PCs
export async function GET() {
    // The Map object needs to be converted to an array of [key, value] pairs
    // for it to be serializable as JSON.
    const allMessages = Array.from(messagesByPc.entries());
    return NextResponse.json(Object.fromEntries(allMessages));
}

export const dynamic = 'force-dynamic';
