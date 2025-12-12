/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */
import { Hands, Results } from '@mediapipe/hands'

// Worker Context
const ctx: Worker = self as any

let hands: Hands | null = null

ctx.onmessage = async (event) => {
    const { image, width, height } = event.data

    if (!hands) {
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            }
        })
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.8
        })
        hands.onResults((results: Results) => {
            // Simplify results for Main Thread
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0]
                // Send back relevant points (Index Tip, Thumb Tip, Wrist)
                // 8: Index Tip, 4: Thumb Tip, 0: Wrist
                const gestureData = {
                    index: landmarks[8],
                    thumb: landmarks[4],
                    wrist: landmarks[0],
                    // Simple Open/Closed detection
                    // If Index tip is below Index DIP (joint), it's curled?
                    // Quick heuristic: Average distance of tips to wrist.
                    isFist: isFist(landmarks)
                }
                ctx.postMessage({ type: 'gesture', data: gestureData })
            } else {
                ctx.postMessage({ type: 'empty' })
            }
        })
    }

    if (image) {
        await hands.send({ image: image as any }) // MediaPipe accepts ImageData/Bitmap
    }
}

function isFist(landmarks: any[]) {
    // Basic heuristic: Are tips close to palm (wrist)?
    // Index Tip (8) vs Wrist (0)
    const wrist = landmarks[0]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]

    const distIndex = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y)
    const distMiddle = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y)

    // Thresholds depend on camera, but relative usually works.
    // Open hand dist is large (~0.3-0.5), Fist is small (<0.2)
    return distIndex < 0.2 && distMiddle < 0.2
}
