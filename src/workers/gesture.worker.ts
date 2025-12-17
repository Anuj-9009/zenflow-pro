/**
 * gesture.worker.ts - Background Gesture Processing
 * 
 * This runs in a separate thread, keeping the UI at 60fps.
 * All heavy TensorFlow/gesture math happens here.
 * Main thread only receives results.
 */

/* eslint-disable no-restricted-globals */

// Worker context - use `self` for posting messages
const ctx = self as unknown as Worker;

interface GestureResult {
    gesture: 'fist' | 'palm' | 'point' | 'none';
    confidence: number;
    landmarks?: any;
}

// Persistence buffer for stable detection
let fistFrameCount = 0;
let palmFrameCount = 0;
const PERSISTENCE_THRESHOLD = 5;

/**
 * Analyze hand landmarks to detect gesture
 * This is the heavy math that would block the UI
 */
function analyzeGesture(imageData: ImageData): GestureResult {
    // Simple skin-tone detection for demonstration
    // In production, this would use TensorFlow HandPose

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let skinPixels = 0;
    let totalPixels = 0;

    // Sample center region for efficiency
    const startX = Math.floor(width * 0.25);
    const endX = Math.floor(width * 0.75);
    const startY = Math.floor(height * 0.25);
    const endY = Math.floor(height * 0.75);

    for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Simple skin detection heuristic
            if (r > 60 && g > 40 && b > 20 &&
                r > g && r > b &&
                (r - g) > 15 &&
                Math.abs(r - g) < 100) {
                skinPixels++;
            }
            totalPixels++;
        }
    }

    const skinRatio = skinPixels / totalPixels;

    // Determine gesture based on skin coverage
    // Low coverage = closed fist, High coverage = open palm
    let currentGesture: 'fist' | 'palm' | 'none' = 'none';
    let confidence = 0;

    if (skinRatio > 0.05) { // Some hand detected
        if (skinRatio > 0.25) {
            // High coverage = open palm
            palmFrameCount++;
            fistFrameCount = 0;

            if (palmFrameCount >= PERSISTENCE_THRESHOLD) {
                currentGesture = 'palm';
                confidence = Math.min(skinRatio * 2, 1);
            }
        } else if (skinRatio > 0.1) {
            // Lower coverage = fist
            fistFrameCount++;
            palmFrameCount = 0;

            if (fistFrameCount >= PERSISTENCE_THRESHOLD) {
                currentGesture = 'fist';
                confidence = Math.min(skinRatio * 3, 1);
            }
        }
    } else {
        // No hand detected
        fistFrameCount = 0;
        palmFrameCount = 0;
    }

    return {
        gesture: currentGesture,
        confidence,
    };
}

// Message handler
ctx.onmessage = async (e: MessageEvent) => {
    const { type, imageData, width, height } = e.data;

    if (type === 'analyze') {
        try {
            // Perform gesture analysis (heavy math)
            const result = analyzeGesture(imageData);

            // Only send if meaningful result
            if (result.gesture !== 'none' && result.confidence > 0.5) {
                ctx.postMessage({
                    type: 'gesture',
                    data: result,
                });
            }
        } catch (error) {
            ctx.postMessage({
                type: 'error',
                error: String(error),
            });
        }
    } else if (type === 'init') {
        // Initialize worker
        console.log('[GestureWorker] Initialized');
        ctx.postMessage({ type: 'ready' });
    }
};

// Export empty object for TypeScript module
export { };
