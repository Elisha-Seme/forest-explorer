import { useCallback, useRef, useEffect } from 'react';

export const useSoundEffects = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const ambientSource = useRef<{ stop: () => void } | null>(null);

    useEffect(() => {
        return () => {
            if (audioCtx.current) {
                audioCtx.current.close();
            }
        };
    }, []);

    const getCtx = () => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
        }
        return audioCtx.current;
    };

    // Procedural Avian Synthesis 2.0 (Multiple Bird Species)
    const playBirdChirp = useCallback(() => {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const species = Math.random();
        const gain = ctx.createGain();

        if (species < 0.4) {
            // "The Chirper" (High frequency sine sweep)
            const baseFreq = 2800 + Math.random() * 800;
            const duration = 0.08 + Math.random() * 0.04;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + duration);
            gain.gain.setValueAtTime(0.008, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            osc.connect(gain);
            osc.start();
            osc.stop(now + duration);
        } else if (species < 0.8) {
            // "The Warbler" (Vibrato/Frequency Modulation)
            const baseFreq = 1800 + Math.random() * 1200;
            const duration = 0.2 + Math.random() * 0.3;
            const osc = ctx.createOscillator();
            const mod = ctx.createOscillator();
            const modGain = ctx.createGain();
            osc.type = 'sine';
            mod.type = 'sine';
            mod.frequency.value = 15 + Math.random() * 10;
            modGain.gain.value = 400;
            mod.connect(modGain);
            modGain.connect(osc.frequency);
            osc.frequency.setValueAtTime(baseFreq, now);
            gain.gain.setValueAtTime(0.012, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            osc.connect(gain);
            mod.start();
            osc.start();
            mod.stop(now + duration);
            osc.stop(now + duration);
        } else {
            // "The Pecker" (Rhythmic Taps)
            const burst = 4 + Math.floor(Math.random() * 5);
            for (let i = 0; i < burst; i++) {
                const tapTime = now + (i * 0.08);
                const osc = ctx.createOscillator();
                const tapGain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, tapTime);
                tapGain.gain.setValueAtTime(0.015, tapTime);
                tapGain.gain.exponentialRampToValueAtTime(0.0001, tapTime + 0.03);
                osc.connect(tapGain);
                tapGain.connect(ctx.destination);
                osc.start(tapTime);
                osc.stop(tapTime + 0.03);
            }
        }

        gain.connect(ctx.destination);
    }, []);

    const startAmbient = useCallback(() => {
        if (ambientSource.current) return;

        let active = true;
        const ambientLoop = () => {
            if (!active) return;
            const nextChirp = 1500 + Math.random() * 4500;
            setTimeout(() => {
                const burst = 1 + Math.floor(Math.random() * 4);
                for (let i = 0; i < burst; i++) {
                    setTimeout(playBirdChirp, i * 250);
                }
                if (active) ambientLoop();
            }, nextChirp);
        };

        ambientSource.current = { stop: () => { active = false; ambientSource.current = null; } };
        ambientLoop();
    }, [playBirdChirp]);

    const playStep = useCallback(() => {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.1);
    }, []);

    const playChime = useCallback(() => {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
    }, []);

    const playSuccess = useCallback(() => {
        const ctx = getCtx();
        const now = ctx.currentTime;
        const playNote = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(0.05, now + start);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };
        playNote(523.25, 0, 0.4);
        playNote(659.25, 0.1, 0.4);
        playNote(783.99, 0.2, 0.4);
        playNote(1046.50, 0.3, 0.6);
    }, []);

    return { playChime, playSuccess, playStep, startAmbient };
};
