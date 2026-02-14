import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';

export const Grass = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const playerPosition = useStore((state) => state.playerPosition);
    const quality = useStore((state) => state.quality);

    const grassCount = useMemo(() => (quality === 'high' ? 8000 : 1500), [quality]);
    const grassSegments = useMemo(() => (quality === 'high' ? 4 : 2), [quality]);

    // Create random positions for grass with more organic variance
    const positions = useMemo(() => {
        const data = [];
        for (let i = 0; i < grassCount; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            // More organic scale variance
            const scale = 0.3 + Math.pow(Math.random(), 2) * 1.2;
            const rotation = Math.random() * Math.PI;
            // Random lean for "wild" look
            const lean = (Math.random() - 0.5) * 0.4;
            data.push({ x, z, scale, rotation, lean });
        }
        return data;
    }, []);

    useEffect(() => {
        if (!meshRef.current) return;
        const dummy = new THREE.Object3D();
        positions.forEach((pos, i) => {
            dummy.position.set(pos.x, 0, pos.z);
            dummy.rotation.set(pos.lean, pos.rotation, 0);
            dummy.scale.set(pos.scale, pos.scale, pos.scale);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [positions]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const material = meshRef.current.material as THREE.ShaderMaterial;
        if (material.uniforms) {
            material.uniforms.uTime.value = state.clock.getElapsedTime();
            material.uniforms.uPlayerPos.value.set(playerPosition.x, 0, playerPosition.z);
        }
    });

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPlayerPos: { value: new THREE.Vector3() },
                uColorLow: { value: new THREE.Color('#0f2912') }, // Deeper, more realistic green
                uColorHigh: { value: new THREE.Color('#4ade80') }, // Brighter tips
            },
            vertexShader: `
                uniform float uTime;
                uniform vec3 uPlayerPos;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vElevation = position.y;
                    
                    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
                    
                    // Multi-layered wind for more organic movement
                    float wind = sin(uTime * 1.5 + worldPosition.x * 0.2) * 0.1;
                    wind += sin(uTime * 2.5 + worldPosition.z * 0.3) * 0.05;
                    
                    // Interaction
                    float dist = distance(worldPosition.xz, uPlayerPos.xz);
                    float bendIntensity = smoothstep(2.5, 0.0, dist);
                    vec2 dir = normalize(worldPosition.xz - uPlayerPos.xz);
                    
                    // Apply to upper segments
                    float influence = pow(uv.y, 2.0); // Curve the bend
                    worldPosition.xz += dir * bendIntensity * influence * 1.2;
                    worldPosition.x += wind * influence;
                    worldPosition.y -= bendIntensity * influence * 0.2; // Squish slightly when stepped on

                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColorLow;
                uniform vec3 uColorHigh;
                varying vec2 vUv;
                
                void main() {
                    // Realistic color gradient
                    vec3 color = mix(uColorLow, uColorHigh, vUv.y);
                    
                    // Simple "fake" shading/AO at base
                    color *= mix(0.4, 1.0, vUv.y);
                    
                    // Translucency simulation (brighter when looking up through it)
                    color += pow(vUv.y, 3.0) * 0.1;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });
    }, []);

    const geometry = useMemo(() => {
        // Create a more blade-like geometry (tapered)
        const geo = new THREE.PlaneGeometry(0.12, 0.6, 1, grassSegments);
        const pos = geo.attributes.position;
        // Taper the top
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            const x = pos.getX(i);
            // Height is 0 to 0.6. Normalize to 0-1.
            const normalizedY = (y + 0.3) / 0.6;
            const taper = 1.0 - pow(normalizedY, 2.0);
            pos.setX(i, x * taper);
        }
        geo.computeVertexNormals();
        return geo;

        function pow(a: number, b: number) { return Math.pow(a, b); }
    }, [grassSegments]);

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, grassCount]} frustumCulled={false} castShadow />
    );
};
