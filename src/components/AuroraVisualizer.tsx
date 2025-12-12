// Aurora Visualizer - with Album Art in 3D Scene
// Combines aurora shader background with floating album art

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { auroraVertexShader, auroraFragmentShader } from '../shaders/AuroraShader'
import AlbumArtMesh from './AlbumArtMesh'

function AuroraMesh() {
    const meshRef = useRef<THREE.Mesh>(null)
    const { bass, mids, highs, colors } = useStore()

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uBass: { value: 0.3 },
        uMids: { value: 0.2 },
        uHighs: { value: 0.1 },
        uColorPrimary: { value: new THREE.Color(colors.primary) },
        uColorSecondary: { value: new THREE.Color(colors.secondary) },
        uColorBackground: { value: new THREE.Color(colors.background) }
    }), [])

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const mat = meshRef.current.material as THREE.ShaderMaterial

        mat.uniforms.uTime.value = clock.elapsedTime
        mat.uniforms.uBass.value += (bass - mat.uniforms.uBass.value) * 0.1
        mat.uniforms.uMids.value += (mids - mat.uniforms.uMids.value) * 0.1
        mat.uniforms.uHighs.value += (highs - mat.uniforms.uHighs.value) * 0.1
        mat.uniforms.uColorPrimary.value.set(colors.primary)
        mat.uniforms.uColorSecondary.value.set(colors.secondary)
        mat.uniforms.uColorBackground.value.set(colors.background)
    })

    return (
        <mesh ref={meshRef} position={[0, 0, -5]}>
            <planeGeometry args={[20, 20]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={auroraVertexShader}
                fragmentShader={auroraFragmentShader}
            />
        </mesh>
    )
}

export default function AuroraVisualizer() {
    const { isInitialized } = useStore()

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            background: '#050510',
            pointerEvents: 'none'
        }}>
            <Canvas
                camera={{ position: [0, 0, 3], fov: 60 }}
                gl={{ antialias: true, alpha: false }}
            >
                {/* Aurora Background at z=-5 */}
                <AuroraMesh />

                {/* Album Art at z=0 (only after initialized) */}
                {isInitialized && <AlbumArtMesh />}

                {/* Ambient light for meshes */}
                <ambientLight intensity={0.5} />
            </Canvas>
        </div>
    )
}
