/**
 * useAnimationLoop - High Performance Animation Hook
 * Uses requestAnimationFrame for 60fps updates
 * Directly manipulates DOM via refs (bypasses React render cycle)
 */

import { useEffect, useRef, useCallback } from 'react';

interface AnimationLoopOptions {
    /** Target frames per second (default: 60) */
    targetFps?: number;
    /** Callback receives delta time in ms since last frame */
    onFrame: (deltaTime: number) => void;
}

/**
 * High-performance animation loop hook
 * Uses RAF for smooth 60fps animations
 * Automatically cleans up on unmount
 */
export function useAnimationLoop(options: AnimationLoopOptions) {
    const { targetFps = 60, onFrame } = options;
    const frameRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const callbackRef = useRef(onFrame);

    // Keep callback ref updated without triggering re-render
    callbackRef.current = onFrame;

    const minFrameTime = 1000 / targetFps;

    const loop = useCallback((time: number) => {
        const deltaTime = time - lastTimeRef.current;

        // Throttle to target FPS
        if (deltaTime >= minFrameTime) {
            callbackRef.current(deltaTime);
            lastTimeRef.current = time;
        }

        frameRef.current = requestAnimationFrame(loop);
    }, [minFrameTime]);

    useEffect(() => {
        frameRef.current = requestAnimationFrame(loop);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [loop]);
}

/**
 * VU Meter Hook - Reads audio levels and updates DOM directly
 * CRITICAL: Uses refs, not state, for 60fps performance
 */
export function useVUMeter(
    getMeterValue: () => { left: number; right: number },
    leftBarRef: React.RefObject<HTMLDivElement>,
    rightBarRef: React.RefObject<HTMLDivElement>
) {
    useAnimationLoop({
        targetFps: 30, // 30fps is enough for VU meters, saves CPU
        onFrame: () => {
            const values = getMeterValue();

            // Convert dB to percentage (approximate, -60dB to 0dB range)
            const leftHeight = Math.max(0, Math.min(100, (values.left + 60) * (100 / 60)));
            const rightHeight = Math.max(0, Math.min(100, (values.right + 60) * (100 / 60)));

            // Direct DOM manipulation - no React overhead
            if (leftBarRef.current) {
                leftBarRef.current.style.height = `${leftHeight}%`;
                // Color coding based on level
                leftBarRef.current.style.background = leftHeight > 85
                    ? 'linear-gradient(to top, #22c55e 0%, #eab308 70%, #ef4444 100%)'
                    : 'linear-gradient(to top, #22c55e 0%, #eab308 100%)';
            }

            if (rightBarRef.current) {
                rightBarRef.current.style.height = `${rightHeight}%`;
                rightBarRef.current.style.background = rightHeight > 85
                    ? 'linear-gradient(to top, #22c55e 0%, #eab308 70%, #ef4444 100%)'
                    : 'linear-gradient(to top, #22c55e 0%, #eab308 100%)';
            }
        }
    });
}

/**
 * Waveform Position Hook - Updates playhead position at 60fps
 */
export function useWaveformPosition(
    getPosition: () => number,
    playheadRef: React.RefObject<HTMLDivElement>,
    containerWidth: number
) {
    useAnimationLoop({
        targetFps: 60,
        onFrame: () => {
            const position = getPosition(); // 0 to 1

            if (playheadRef.current) {
                const xPos = position * containerWidth;
                // Use transform for GPU acceleration
                playheadRef.current.style.transform = `translateX(${xPos}px)`;
            }
        }
    });
}
