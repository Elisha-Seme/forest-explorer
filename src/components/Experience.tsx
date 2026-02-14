import { Environment, Sky, ContactShadows, useTexture } from '@react-three/drei';
import { Player } from './Player';
import { Forest } from './Forest';
import { Grass } from './Grass';
import { Wildlife } from './Wildlife';
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, N8AO, Vignette, BrightnessContrast } from '@react-three/postprocessing';

export const Experience = () => {
    const sunRef = useRef(new THREE.Vector3());
    const skyRef = useRef<any>(null);
    const lightRef = useRef<THREE.DirectionalLight>(null);

    // Load verified textures for the ground
    const [colorMap] = useTexture([
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/terrain/grasslight-big.jpg'
    ]);

    useMemo(() => {
        if (colorMap) {
            colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
            colorMap.repeat.set(25, 25);
            colorMap.anisotropy = 16;
        }
    }, [colorMap]);

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime() * 0.05;
        const x = Math.sin(time) * 100;
        const y = Math.cos(time) * 100;
        const z = Math.sin(time * 0.5) * 50;

        sunRef.current.set(x, y, z);

        if (lightRef.current) {
            lightRef.current.position.copy(sunRef.current);
            const sunHeight = Math.max(0, y / 100);
            lightRef.current.intensity = 0.2 + sunHeight * 1.5;

            if (y < 20 && y > -20) {
                lightRef.current.color.setHSL(0.05, 0.8, 0.6);
            } else {
                lightRef.current.color.setHSL(0.1, 0.2, 1);
            }
        }
    });

    return (
        <>
            <EffectComposer>
                <N8AO
                    halfRes
                    color="black"
                    aoRadius={2}
                    intensity={1.5}
                />
                <Bloom
                    luminanceThreshold={1.0}
                    mipmapBlur
                    intensity={0.4}
                    radius={0.3}
                />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
                <BrightnessContrast brightness={0.02} contrast={0.1} />
            </EffectComposer>

            <Sky ref={skyRef} sunPosition={[100, 20, 100]} />

            <Environment
                preset="forest"
                ground={{ height: 10, radius: 150, scale: 200 }}
            />

            <ambientLight intensity={0.4} />

            <directionalLight
                ref={lightRef}
                position={[10, 20, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={150}
                shadow-camera-left={-75}
                shadow-camera-right={75}
                shadow-camera-top={75}
                shadow-camera-bottom={-75}
                shadow-bias={-0.0001}
            />

            <fogExp2 attach="fog" args={['#1a2f1a', 0.012]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial
                    map={colorMap}
                    roughness={0.9}
                    metalness={0.05}
                />
            </mesh>

            <Player />
            <Forest />
            <Grass />
            <Wildlife />

            <ContactShadows
                position={[0, 0, 0]}
                opacity={0.4}
                blur={2.0}
                scale={150}
                far={10}
                resolution={512}
                color="#000000"
            />
        </>
    );
};
