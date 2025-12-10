// Album Art 3D Mesh - Floating album cover in 3D space
// Positioned at z=0 (in front of aurora, behind UI)

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

export default function AlbumArtMesh() {
    const meshRef = useRef<THREE.Mesh>(null)
    const { bass, colors } = useStore()

    // Subtle floating animation
    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const t = clock.elapsedTime

        // Gentle breathing motion synced to bass
        const breathe = 1 + bass * 0.03
        meshRef.current.scale.setScalar(breathe)

        // Subtle rotation
        meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.05
        meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.02

        // Float up/down
        meshRef.current.position.y = Math.sin(t * 0.5) * 0.05
    })

    return (
        <group position={[0, 0, 0]}>
            {/* Glow behind album */}
            <mesh position={[0, 0, -0.1]}>
                <planeGeometry args={[2.2, 2.2]} />
                <meshBasicMaterial
                    color={colors.primary}
                    transparent
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Album frame with gradient placeholder */}
            <mesh ref={meshRef} position={[0, 0, 0]}>
                <planeGeometry args={[1.8, 1.8]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.95}
                >
                    {/* Will be replaced with texture when real album art is available */}
                </meshBasicMaterial>
            </mesh>

            {/* Glass reflection overlay */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[1.8, 1.8]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.05}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}
