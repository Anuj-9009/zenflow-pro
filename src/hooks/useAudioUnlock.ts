/**
 * useAudioUnlock - Global Audio Context Unlock Hook
 * 
 * Browsers block AudioContext until first user gesture.
 * This hook listens for the first click/keydown and unlocks Tone.js.
 */

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export function useAudioUnlock() {
    const isUnlocked = useRef(false);

    useEffect(() => {
        if (isUnlocked.current) return;

        const unlock = async () => {
            if (isUnlocked.current) return;

            try {
                await Tone.start();
                isUnlocked.current = true;
                console.log('🔓 Audio Engine Unlocked');
                console.log(`   AudioContext State: ${Tone.context.state}`);

                // Clean up listeners immediately after unlock
                window.removeEventListener('click', unlock);
                window.removeEventListener('keydown', unlock);
                window.removeEventListener('touchstart', unlock);
            } catch (error) {
                console.error('❌ Audio Unlock Failed:', error);
            }
        };

        // Listen for first user interaction
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });

        // Cleanup on unmount
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
    }, []);

    return isUnlocked.current;
}
