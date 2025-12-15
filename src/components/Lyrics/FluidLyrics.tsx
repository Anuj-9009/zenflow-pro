import React, { useRef, useEffect } from 'react';

// Mock Data structure for a Lyrics Line
export interface LyricLine {
    text: string;
    startTime: number; // in seconds
    duration: number; // in seconds
}

interface Props {
    lines: LyricLine[];
    currentTime: number; // Current playback time from AudioEngine
    onSeek: (time: number) => void;
}

export const FluidLyrics: React.FC<Props> = ({ lines, currentTime, onSeek }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

    // THE PHYSICS LOOP
    // We manipulate the DOM directly for 60FPS smoothness
    useEffect(() => {
        const updateLoop = () => {
            lines.forEach((line, index) => {
                const domNode = lineRefs.current[index];
                if (!domNode) return;

                // 1. Calculate Progress (0.0 to 1.0) of this specific line
                const endTime = line.startTime + line.duration;
                let progress = 0;

                if (currentTime >= line.startTime && currentTime <= endTime) {
                    // We are currently singing this line
                    progress = (currentTime - line.startTime) / line.duration;
                } else if (currentTime > endTime) {
                    // Line is finished
                    progress = 1;
                }

                // 2. Map Progress to Gradient Position
                // 100% = All Grey, 0% = All White. So we invert it.
                const backgroundPos = (1 - progress) * 100;

                // 3. Apply Style Directly (Zero React State Overhead)
                domNode.style.backgroundPosition = `${backgroundPos}% 0`;

                // 4. Auto-Scroll Logic (Smooth Center Lock)
                if (progress > 0 && progress < 1 && containerRef.current) {
                    const container = containerRef.current;
                    const offset = domNode.offsetTop - container.offsetHeight / 2 + domNode.offsetHeight / 2;

                    // Use 'scrollTo' with smooth behavior for the "Fluid" feel
                    container.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }
            });

            requestAnimationFrame(updateLoop);
        };

        const frameId = requestAnimationFrame(updateLoop);
        return () => cancelAnimationFrame(frameId);
    }, [currentTime, lines]); // Re-run if time updates (or remove dep if using Ref for time)

    return (
        <div
            ref={containerRef}
            className="h-[600px] w-full overflow-y-auto no-scrollbar relative flex flex-col items-center py-[300px]"
        >
            {lines.map((line, i) => (
                <p
                    key={i}
                    ref={(el) => (lineRefs.current[i] = el)}
                    onClick={() => onSeek(line.startTime)}
                    className={`
            karaoke-text text-4xl font-extrabold py-6 cursor-pointer
            ${currentTime >= line.startTime && currentTime <= line.startTime + line.duration ? 'active' : ''}
          `}
                    // Optimizations
                    style={{
                        backgroundPosition: '100% 0',
                        willChange: (currentTime >= line.startTime && currentTime <= line.startTime + line.duration) ? 'background-position, transform' : 'auto'
                    }}
                >
                    {line.text}
                </p>
            ))}
        </div>
    );
};
