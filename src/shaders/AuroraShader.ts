// Aurora Shader - INLINE TypeScript strings
// Beautiful flowing aurora borealis effect with audio reactivity

export const auroraVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const auroraFragmentShader = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uBass;
uniform float uMids;
uniform float uHighs;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorBackground;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion
float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 5; i++) {
        f += amp * snoise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = vUv;
    
    // Audio-reactive parameters
    float expansion = 1.0 + uBass * 0.8;
    float detail = 1.0 + uHighs * 3.0;
    float colorIntensity = 0.5 + uMids * 0.5;
    
    // Time
    float time = uTime * 0.1;
    
    // Aurora layers using domain warping
    vec3 p = vec3(uv * 2.0 * expansion, time);
    
    // First warp layer
    float n1 = fbm(p + vec3(time * 0.2, 0.0, 0.0));
    
    // Second warp layer (more detail with highs)
    float n2 = fbm(p * detail + vec3(n1 * 2.0, time * 0.1, n1));
    
    // Third layer for aurora bands
    float n3 = fbm(p * 0.5 + vec3(n2 * 1.5, n1, time * 0.05));
    
    // Combine noise for aurora shape
    float aurora = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    aurora = pow(abs(aurora), 1.5) * 2.0;
    
    // Vertical gradient for aurora curtain effect
    float curtain = smoothstep(0.0, 0.7, uv.y) * smoothstep(1.0, 0.5, uv.y);
    aurora *= curtain;
    
    // Color mixing based on aurora intensity
    vec3 color = uColorBackground;
    
    // Add primary color (aurora glow)
    float primaryMix = smoothstep(0.1, 0.5, aurora) * colorIntensity;
    color = mix(color, uColorPrimary, primaryMix);
    
    // Add secondary color (bright edges)
    float secondaryMix = smoothstep(0.3, 0.8, aurora) * colorIntensity * 0.7;
    color = mix(color, uColorSecondary, secondaryMix);
    
    // Add bright core
    float core = smoothstep(0.5, 1.0, aurora);
    color += vec3(1.0, 1.0, 0.95) * core * 0.3 * colorIntensity;
    
    // Subtle glow on bass hits
    color += uColorPrimary * uBass * 0.15;
    
    // Ensure never fully black
    color = max(color, uColorBackground * 0.3);
    
    // Soft vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 1.0, vignette);
    color *= 0.8 + vignette * 0.2;
    
    gl_FragColor = vec4(color, 1.0);
}
`
