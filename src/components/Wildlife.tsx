import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const BIRD_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Stork.glb';

export const Wildlife = () => {
    // Generate bird instances
    const birds = useMemo(() => {
        return Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            isPerched: i < 4, // First 4 are perched
            // Random tree-like position
            perchPos: [
                (Math.random() - 0.5) * 120,
                3.5 + Math.random() * 2,
                (Math.random() - 0.5) * 120
            ] as [number, number, number],
            flightSeed: Math.random() * 100
        }));
    }, []);

    return (
        <group>
            {birds.map(bird => (
                <Bird key={bird.id} {...bird} />
            ))}
        </group>
    );
};

const Bird = ({ isPerched, perchPos, flightSeed }: any) => {
    const group = useRef<THREE.Group>(null!);
    const { scene, animations } = useGLTF(BIRD_URL);
    const { actions } = useAnimations(animations, group);

    // Scale it way down to look like a small forest bird, not a giant stork
    const BIRD_SCALE = 0.008;

    useEffect(() => {
        if (actions && animations.length > 0) {
            // High speed flapping if flying, subtle if perched
            const action = actions[animations[0].name];
            if (action) {
                action.timeScale = isPerched ? 0.2 : 2.0;
                action.play();
            }
        }
    }, [actions, animations, isPerched]);

    useFrame((state) => {
        if (!group.current) return;

        if (isPerched) {
            // Subtle head/body movement
            group.current.position.set(perchPos[0], perchPos[1], perchPos[2]);
            group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + flightSeed) * 0.5;

            // Randomly "fly away" logic could go here, but for now we keep them stable perches
        } else {
            // Flying path
            const t = state.clock.elapsedTime * 0.4 + flightSeed;
            const radius = 20 + Math.sin(t * 0.5) * 10;
            const x = Math.cos(t) * radius;
            const z = Math.sin(t) * radius;
            const y = 8 + Math.sin(t * 2) * 3;

            group.current.position.set(x, y, z);

            // Orient towards movement
            const nextT = t + 0.1;
            const nextX = Math.cos(nextT) * radius;
            const nextZ = Math.sin(nextT) * radius;
            group.current.lookAt(nextX, y, nextZ);
        }
    });

    // Color correction: Turn the white stork into a more realistic forest-colored bird (brownish/black)
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                material.color.set('#3d2b1f'); // Leaf-litter brown
                material.metalness = 0;
                material.roughness = 0.9;
            }
        });
    }, [scene]);

    const sceneClone = useMemo(() => scene.clone(), [scene]);

    return (
        <group ref={group}>
            <primitive object={sceneClone} scale={BIRD_SCALE} />
        </group>
    );
};

useGLTF.preload(BIRD_URL);
