// ZenFlow Pro - Persistent Fluid Shader Background
// WebGL shader that runs continuously, supports dimming/blur for lyrics mode

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store/useStore'

interface FluidShaderProps {
    dimmed?: boolean
    blurred?: boolean
}

// Vertex Shader
const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Fragment Shader
const fragmentShader = `
  precision highp float;
  
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 colorDark;
  uniform vec3 colorVibrant;
  uniform float bass;
  uniform float mids;
  uniform float audioLevel;
  uniform float dimAmount;
  
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
      f += w * snoise(p);
      p *= 2.0;
      w *= 0.5;
    }
    return f;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;
    
    float t = time * 0.1;
    
    // Bass shockwave
    float dist = length(p);
    p += p * bass * 0.4 * exp(-dist * 1.5) * sin(dist * 8.0 - time * 2.0);
    
    // Mids wobble
    p += vec2(sin(p.y * 3.0 + time) * mids * 0.08, cos(p.x * 3.0 + time) * mids * 0.08);
    
    // Fluid layers
    float n1 = fbm(p * 1.2 + t);
    float n2 = fbm(p * 2.0 - t * 0.5 + vec2(n1 * 0.5));
    float n3 = fbm(p * 3.0 + t * 0.3 + vec2(n2 * 0.3));
    
    float liquid = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    liquid = liquid * 0.5 + 0.5;
    liquid += audioLevel * 0.1;
    
    // Color mixing
    vec3 col = mix(colorDark, colorVibrant, liquid * 0.6 + 0.2);
    
    // Edge glow
    float edge = smoothstep(0.45, 0.65, liquid);
    col += colorVibrant * edge * (0.25 + bass * 0.25);
    
    // Vignette
    float vignette = 1.0 - smoothstep(0.3, 1.5, length(p));
    col *= vignette;
    
    // Grain
    float grain = fract(sin(dot(uv * time * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * 0.05;
    
    // Apply dimming for lyrics mode
    col *= (1.0 - dimAmount * 0.6);
    
    gl_FragColor = vec4(col, 1.0);
  }
`

// Extract colors from album
function extractColors(url: string): Promise<{ dark: number[]; vibrant: number[] }> {
    return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
            const c = document.createElement('canvas')
            const ctx = c.getContext('2d')!
            c.width = c.height = 50
            ctx.drawImage(img, 0, 0, 50, 50)
            const d = ctx.getImageData(0, 0, 50, 50).data

            let dR = 0, dG = 0, dB = 0, dC = 0, vR = 0, vG = 0, vB = 0, vC = 0
            for (let i = 0; i < d.length; i += 4) {
                const br = (d[i] + d[i + 1] + d[i + 2]) / 3
                const sat = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])
                if (br < 100 && sat > 20) { dR += d[i]; dG += d[i + 1]; dB += d[i + 2]; dC++ }
                if (sat > 50 && br > 40 && br < 200) { vR += d[i]; vG += d[i + 1]; vB += d[i + 2]; vC++ }
            }

            resolve({
                dark: dC > 5 ? [dR / dC / 255, dG / dC / 255, dB / dC / 255] : [0.02, 0.02, 0.05],
                vibrant: vC > 5 ? [vR / vC / 255, vG / vC / 255, vB / vC / 255] : [0, 0.5, 0.5]
            })
        }
        img.onerror = () => resolve({ dark: [0.02, 0.02, 0.05], vibrant: [0, 0.5, 0.5] })
        img.src = url
    })
}

function FluidShader({ dimmed = false, blurred = false }: FluidShaderProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const animationRef = useRef<number>(0)
    const startTimeRef = useRef(Date.now())
    const dimAmountRef = useRef(0)
    const appFocusedRef = useRef(true) // Performance: Track focus state

    // Use selectors to minimize re-renders
    const trackArtUrl = useStore(state => state.track.artUrl)
    const bass = useStore(state => state.bass)
    const mids = useStore(state => state.mids)
    const volume = useStore(state => state.volume)
    const isPlaying = useStore(state => state.isPlaying)
    const [colors, setColors] = useState({ dark: [0.02, 0.02, 0.05], vibrant: [0, 0.5, 0.5] })

    // Performance: Listen for focus changes to pause animations
    useEffect(() => {
        const electron = (window as any).electron
        if (electron?.window?.onFocusChange) {
            electron.window.onFocusChange((focused: boolean) => {
                appFocusedRef.current = focused
                console.log('[FluidShader] Focus changed:', focused)
            })
        }
    }, [])

    // Extract colors from album
    useEffect(() => {
        if (trackArtUrl) {
            extractColors(trackArtUrl).then(setColors)
        }
    }, [trackArtUrl])

    const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})

    // Initialize WebGL once
    const initGL = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || glRef.current) return

        const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
        if (!gl) return
        glRef.current = gl

        const vs = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vs, vertexShader)
        gl.compileShader(vs)

        const fs = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fs, fragmentShader)
        gl.compileShader(fs)

        const program = gl.createProgram()!
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        gl.useProgram(program)
        programRef.current = program

        // Cache Uniforms
        uniformsRef.current = {
            time: gl.getUniformLocation(program, 'time'),
            resolution: gl.getUniformLocation(program, 'resolution'),
            colorDark: gl.getUniformLocation(program, 'colorDark'),
            colorVibrant: gl.getUniformLocation(program, 'colorVibrant'),
            bass: gl.getUniformLocation(program, 'bass'),
            mids: gl.getUniformLocation(program, 'mids'),
            audioLevel: gl.getUniformLocation(program, 'audioLevel'),
            dimAmount: gl.getUniformLocation(program, 'dimAmount')
        }

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

        const pos = gl.getAttribLocation(program, 'position')
        gl.enableVertexAttribArray(pos)
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    }, [])

    // Render loop - runs continuously
    const render = useCallback(() => {
        if (document.hidden) {
            // Pause if hidden (save GPU)
            // We don't request next frame. Visibility listener will restart.
            return
        }

        const gl = glRef.current
        const program = programRef.current
        const canvas = canvasRef.current
        const u = uniformsRef.current

        if (!gl || !program || !canvas) {
            animationRef.current = requestAnimationFrame(render)
            return
        }

        // Resize if needed
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            gl.viewport(0, 0, canvas.width, canvas.height)
        }

        // Smooth dim transition
        const targetDim = dimmed ? 1 : 0
        dimAmountRef.current += (targetDim - dimAmountRef.current) * 0.05

        const time = (Date.now() - startTimeRef.current) / 1000

        gl.uniform1f(u.time, time)
        gl.uniform2f(u.resolution, canvas.width, canvas.height)
        gl.uniform3f(u.colorDark, colors.dark[0], colors.dark[1], colors.dark[2])
        gl.uniform3f(u.colorVibrant, colors.vibrant[0], colors.vibrant[1], colors.vibrant[2])
        gl.uniform1f(u.bass, bass)
        gl.uniform1f(u.mids, mids)
        gl.uniform1f(u.audioLevel, isPlaying ? volume : 0.2)
        gl.uniform1f(u.dimAmount, dimAmountRef.current)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        animationRef.current = requestAnimationFrame(render)
    }, [colors, bass, mids, volume, isPlaying, dimmed])

    useEffect(() => {
        initGL()

        const handleVisibility = () => {
            if (!document.hidden) {
                // Restart loop
                cancelAnimationFrame(animationRef.current)
                animationRef.current = requestAnimationFrame(render)
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        animationRef.current = requestAnimationFrame(render)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            cancelAnimationFrame(animationRef.current)
        }
    }, [initGL, render])

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            filter: blurred ? 'blur(15px)' : 'none',
            transition: 'filter 0.5s ease'
        }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
        </div>
    )
}

// Wrap in React.memo to prevent re-renders when parent state changes
export default React.memo(FluidShader)
