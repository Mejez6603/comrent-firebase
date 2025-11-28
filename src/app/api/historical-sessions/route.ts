import { NextResponse } from 'next/server';
import type { PC, PaymentMethod, PricingTier } from '@/lib/types';
import { subMonths, eachDayOfInterval, setHours, setMinutes, setSeconds, formatISO } from 'date-fns';

const pcNames = Array.from({ length: 12 }, (_, i) => `PC-${String(i + 1).padStart(2, '0')}`);
const paymentMethods: PaymentMethod[] = ['GCash', 'Maya', 'QR Code'];
const pricingTiers: Omit<PricingTier, 'label'>[] = [
    { value: '30', price: 30 },
    { value: '60', price: 50 },
    { value: '120', price: 90 },
    { value: '180', price: 120 },
];

function generateMockSessions(): PC[] {
    const sessions: PC[] = [];
    const now = new Date();
    const start = subMonths(now, 4); // Go back to roughly August
    const end = now;

    const interval = eachDayOfInterval({ start, end });

    interval.forEach(day => {
        // Simulate more sessions on weekends
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const dailySessionCount = isWeekend ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 20) + 10;

        for (let i = 0; i < dailySessionCount; i++) {
            const pcName = pcNames[Math.floor(Math.random() * pcNames.length)];
            const pricing = pricingTiers[Math.floor(Math.random() * pricingTiers.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

            // Simulate peak hours (2 PM to 10 PM)
            const hour = Math.random() < 0.7 ? Math.floor(Math.random() * 8) + 14 : Math.floor(Math.random() * 24);
            const minute = Math.floor(Math.random() * 60);
            const second = Math.floor(Math.random() * 60);
            
            const sessionDate = setSeconds(setMinutes(setHours(day, hour), minute), second);

            // Ensure we don't generate sessions in the future
            if (sessionDate > now) continue;

            const session: PC = {
                id: `${pcName}-${sessionDate.getTime()}-${Math.random()}`,
                name: pcName,
                status: 'pending_payment', // Assume all historical sessions are complete and paid
                user: `user_${Math.random().toString(36).substring(2, 9)}`,
                email: `user_${Math.random().toString(36).substring(2, 9)}@example.com`,
                session_start: formatISO(sessionDate),
                session_duration: Number(pricing.value),
                paymentMethod: paymentMethod,
            };
            sessions.push(session);
        }
    });

    return sessions;
}


export async function GET() {
  const mockSessions = generateMockSessions();
  return NextResponse.json(mockSessions);
}

export const dynamic = 'force-dynamic';
