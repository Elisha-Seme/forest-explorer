import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';

const GRASS_COUNT = 10000; // High density for plush look
const GRASS_SEGMENTS = 5; // More segments for elegant curves

export const Grass = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const playerPosition = useStore((state) => state.playerPosition);

    const positions = useMemo(() => {
        const data = [];
        for (let i = 0; i < GRASS_COUNT; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            const scale = 0.4 + Math.pow(Math.random(), 3) * 1.5;
            const rotation = Math.random() * Math.PI;
            const lean = (Math.random() - 0.5) * 0.5;
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
                uColorLow: { value: new THREE.Color('#0a1a0b') }, // Very dark base
                uColorHigh: { value: new THREE.Color('#397d3e') }, // Natural forest green
                uColorTip: { value: new THREE.Color('#bbf7d0') }, // Sunkissed tips
            },
            vertexShader: `
                uniform float uTime;
                uniform vec3 uPlayerPos;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
                    
                    // Natural multi-scale wind
                    float noise = sin(uTime * 1.2 + worldPosition.x * 0.5) * 
                                  cos(uTime * 0.8 + worldPosition.z * 0.4);
                    float wind = noise * 0.15;
                    
                    // Character interaction
                    float dist = distance(worldPosition.xz, uPlayerPos.xz);
                    float bendIntensity = smoothstep(2.8, 0.0, dist);
                    vec2 dir = normalize(worldPosition.xz - uPlayerPos.xz);
                    
                    // Curve calculation (starts from 0 at base)
                    float influence = pow(uv.y, 2.5); 
                    worldPosition.xz += dir * bendIntensity * influence * 1.5;
                    worldPosition.x += wind * influence;
                    worldPosition.y -= bendIntensity * influence * 0.3;

                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColorLow;
                uniform vec3 uColorHigh;
                uniform vec3 uColorTip;
                varying vec2 vUv;
                
                void main() {
                    // Complex 3-way gradient for extreme realism
                    vec3 baseColor = mix(uColorLow, uColorHigh, smoothstep(0.0, 0.7, vUv.y));
                    vec3 finalColor = mix(baseColor, uColorTip, smoothstep(0.7, 1.0, vUv.y));
                    
                    // Deep AO simulation at the base
                    float ao = mix(0.2, 1.0, smoothstep(0.0, 0.4, vUv.y));
                    finalColor *= ao;
                    
                    // Subtle subsurface scattering simulation
                    finalColor += pow(vUv.y, 4.0) * 0.15;

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });
    }, []);

    const geometry = useMemo(() => {
        // Tapered blade geometry
        const width = 0.12;
        const height = 0.6;
        const geo = new THREE.PlaneGeometry(width, height, 1, GRASS_SEGMENTS);

        // GROUNDING: Shift geometry so it starts from Y=0
        geo.translate(0, height / 2, 0);

        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = (pos.getY(i)) / height; // 0 to 1
            const x = pos.getX(i);
            // Sharp organic taper
            const taper = 1.0 - pow(y, 3.0);
            pos.setX(i, x * taper);
        }
        geo.computeVertexNormals();
        return geo;

        function pow(a: number, b: number) { return Math.pow(a, b); }
    }, []);

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, GRASS_COUNT]} frustumCulled={false} castShadow />
    );
};
