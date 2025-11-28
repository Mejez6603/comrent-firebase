'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/app/api/messages/route';

// Store AudioContext in a way that persists across re-renders
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (typeof window !== 'undefined' && (!audioContext || audioContext.state === 'closed')) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

const playMessageSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime); // High-pitched, attention-grabbing
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
};

export const useChatSounds = (conversations: Record<string, Message[]>, role: 'admin' | 'user') => {
    const previousMessageCounts = useRef<Record<string, number>>({});

    useEffect(() => {
        if (role !== 'admin') return;

        const newCounts: Record<string, number> = {};
        let hasNewMessage = false;

        for (const pcName in conversations) {
            const userMessages = conversations[pcName].filter(m => m.sender === 'user');
            const newCount = userMessages.length;
            newCounts[pcName] = newCount;
            
            const oldCount = previousMessageCounts.current[pcName] || 0;

            if (newCount > oldCount) {
                hasNewMessage = true;
            }
        }

        if (hasNewMessage) {
            playMessageSound();
        }

        previousMessageCounts.current = newCounts;

    }, [conversations, role]);
};
