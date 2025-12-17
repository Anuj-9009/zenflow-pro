/**
 * useGestureEngine - Zero-Math Gesture Hook
 * 
 * This hook does NO computation on the main thread.
 * All gesture math is delegated to gesture.worker.ts.
 * Main thread only receives results and updates state.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type GestureType = 'fist' | 'palm' | 'point' | 'none';

interface GestureState {
    gesture: GestureType;
    confidence: number;
    enabled: boolean;
    cameraReady: boolean;
}

interface UseGestureEngineOptions {
    throttleMs?: number; // How often to send frames (default 100ms)
    onGesture?: (gesture: GestureType, confidence: number) => void;
}

export function useGestureEngine(options: UseGestureEngineOptions = {}) {
    const { throttleMs = 100, onGesture } = options;

    const [state, setState] = useState<GestureState>({
        gesture: 'none',
        confidence: 0,
        enabled: false,
        cameraReady: false,
    });

    const workerRef = useRef<Worker | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const intervalRef = useRef<number>();
    const lastGestureRef = useRef<GestureType>('none');

    // Initialize worker
    useEffect(() => {
        if (!state.enabled) return;

        // Create worker using Vite's worker syntax
        const worker = new Worker(
            new URL('../workers/gesture.worker.ts', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (e) => {
            const { type, data, error } = e.data;

            if (type === 'gesture') {
                const { gesture, confidence } = data;

                // Only update if gesture changed (prevents flicker)
                if (gesture !== lastGestureRef.current) {
                    lastGestureRef.current = gesture;
                    setState(prev => ({ ...prev, gesture, confidence }));
                    onGesture?.(gesture, confidence);
                }
            } else if (type === 'ready') {
                console.log('🖐️ Gesture Engine Ready');
            } else if (type === 'error') {
                console.error('Gesture Worker Error:', error);
            }
        };

        worker.postMessage({ type: 'init' });
        workerRef.current = worker;

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, [state.enabled, onGesture]);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setState(prev => ({ ...prev, cameraReady: true }));
                console.log('📷 Camera Ready');
            }
        } catch (err) {
            console.error('Camera Error:', err);
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setState(prev => ({ ...prev, cameraReady: false }));
    }, []);

    // Frame loop - Just captures and sends, no processing
    useEffect(() => {
        if (!state.enabled || !state.cameraReady || !workerRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Set canvas size
        canvas.width = 320;
        canvas.height = 240;

        // Throttled frame capture
        intervalRef.current = window.setInterval(() => {
            if (!video.videoWidth) return; // Video not ready

            ctx.drawImage(video, 0, 0, 320, 240);
            const imageData = ctx.getImageData(0, 0, 320, 240);

            // Send to worker - main thread does ZERO math
            workerRef.current?.postMessage({
                type: 'analyze',
                imageData,
                width: 320,
                height: 240,
            });
        }, throttleMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state.enabled, state.cameraReady, throttleMs]);

    // Enable/disable
    const setEnabled = useCallback((enabled: boolean) => {
        setState(prev => ({ ...prev, enabled }));

        if (enabled) {
            startCamera();
        } else {
            stopCamera();
            lastGestureRef.current = 'none';
            setState(prev => ({ ...prev, gesture: 'none', confidence: 0 }));
        }
    }, [startCamera, stopCamera]);

    return {
        gesture: state.gesture,
        confidence: state.confidence,
        enabled: state.enabled,
        cameraReady: state.cameraReady,
        setEnabled,
        videoRef,
        canvasRef,
    };
}
