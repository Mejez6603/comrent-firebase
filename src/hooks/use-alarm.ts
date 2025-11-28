'use client';

import { useRef, useCallback } from 'react';

// Store AudioContext and oscillator in a way that persists across re-renders
let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;

const getAudioContext = () => {
    if (typeof window !== 'undefined' && (!audioContext || audioContext.state === 'closed')) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

export const useAlarm = () => {

    const startAlarm = useCallback(() => {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Stop any existing alarm before starting a new one
        if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
        }

        // Resume context if it's suspended
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(900, ctx.currentTime); // High-pitched beep
        oscillator.loop = true; // Make the sound repeat

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);


        // Create a repeating pattern
        const playBeep = () => {
            if (!oscillator) return;
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        }
        
        // Start immediately and repeat
        playBeep();
        const intervalId = setInterval(playBeep, 500);

        oscillator.start();
        
        // Assign interval to oscillator to clear it later
        (oscillator as any).intervalId = intervalId;

    }, []);

    const stopAlarm = useCallback(() => {
        if (oscillator) {
            clearInterval((oscillator as any).intervalId);
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
        }
    }, []);

    return { startAlarm, stopAlarm };
};
