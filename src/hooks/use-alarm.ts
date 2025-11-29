'use client';

import { useRef, useCallback } from 'react';

export const useAlarm = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);

    const getAudioContext = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        }
        return audioContextRef.current;
    }, []);


    const startAlarm = useCallback(() => {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Stop any existing alarm before starting a new one
        if (oscillatorRef.current) {
            try {
                clearInterval((oscillatorRef.current as any).intervalId);
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch (e) {
                // Ignore errors from stopping an already stopped oscillator
            }
        }

        // Resume context if it's suspended
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(900, ctx.currentTime); // High-pitched beep
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);

        // Create a repeating pattern
        const playBeep = () => {
            if (!oscillatorRef.current) return;
            // Check if context is running, otherwise resume it.
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        }
        
        // Start immediately and repeat
        const intervalId = setInterval(playBeep, 500);
        
        oscillator.start();
        
        // Assign interval to oscillator to clear it later
        (oscillator as any).intervalId = intervalId;
        oscillatorRef.current = oscillator;

    }, [getAudioContext]);

    const stopAlarm = useCallback(() => {
        if (oscillatorRef.current) {
            try {
                clearInterval((oscillatorRef.current as any).intervalId);
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch (e) {
                // Ignore errors, it might have been stopped already
            } finally {
                oscillatorRef.current = null;
            }
        }
    }, []);

    return { startAlarm, stopAlarm };
};
