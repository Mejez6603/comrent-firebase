
'use client';

import { useEffect, useRef } from 'react';
import type { Notification } from '@/components/admin/admin-notification-panel';

type SoundType = 'approval' | 'time-up' | 'available' | 'ended';

// Store AudioContext in a way that persists across re-renders
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (typeof window !== 'undefined' && !audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

const playSound = (type: SoundType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if it's suspended (required by modern browsers)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);

    switch (type) {
        case 'approval': // High-pitched, urgent
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
            break;
        case 'time-up': // Mid-range, repeated
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
            break;
        case 'available': // Pleasant, higher pitch
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
            break;
        case 'ended': // Lower, more distinct
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(330, ctx.currentTime); // E4
            break;
        default:
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    }
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
};

export const useNotificationSounds = (notifications: Notification[]) => {
    const previousNotificationsRef = useRef<Map<string, Notification>>(new Map());

    useEffect(() => {
        const currentNotificationsMap = new Map(notifications.map(n => [n.id, n]));
        const previousNotificationsMap = previousNotificationsRef.current;

        // Find new notifications
        for (const [id, notification] of currentNotificationsMap.entries()) {
            if (!previousNotificationsMap.has(id)) {
                playSound(notification.type);
            }
        }

        // Update the ref for the next render
        previousNotificationsRef.current = currentNotificationsMap;

    }, [notifications]);
};
