import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStore, type Word } from '../store/useStore';
import { Sparkles, Float, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const VOCABULARY: Record<number, Word[]> = {
    1: [
        { word: 'Lush', meaning: 'Rich and very green.' },
        { word: 'Canopy', meaning: 'The top layer of a forest.' },
        { word: 'Ancient', meaning: 'Very, very old.' },
    ],
    2: [
        { word: 'Forage', meaning: 'To search for food in the wild.' },
        { word: 'Mysterious', meaning: 'Strange and interesting, hard to explain.' },
        { word: 'Ecosystem', meaning: 'All living things in an area interacting together.' },
    ],
    3: [
        { word: 'Symbiosis', meaning: 'A relationship where two organisms help each other.' },
        { word: 'Biodiversity', meaning: 'The variety of life in the world or a habitat.' },
        { word: 'Arboreal', meaning: 'Living in or relating to trees.' },
    ]
};

export const Forest = () => {
    const level = useStore((state) => state.level);
    const unlockWord = useStore((state) => state.unlockWord);
    const foundWords = useStore((state) => state.foundWords);
    const setTreasurePositions = useStore((state) => state.setTreasurePositions);

    const currentWords = useMemo(() => VOCABULARY[level] || VOCABULARY[1], [level]);
    const count = 120 + level * 20;

    const instances = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            let x, z;
            do {
                x = (Math.random() - 0.5) * 160;
                z = (Math.random() - 0.5) * 160;
            } while (Math.abs(x) < 15 && Math.abs(z) < 15);

            data.push({
                position: [x, 0, z] as [number, number, number],
                scale: 1.8 + Math.random() * 2.5,
                rotation: [0, Math.random() * Math.PI, 0] as [number, number, number],
                variant: Math.random() > 0.5 ? 0 : 1,
                seed: Math.random() * 100
            });
        }
        return data;
    }, [count]);

    const treasures = useMemo(() => {
        return currentWords.map((word, i) => ({
            ...word,
            id: `${level}-${i}`,
            position: [
                (Math.random() - 0.5) * 110,
                0.5,
                (Math.random() - 0.5) * 110
            ] as [number, number, number]
        }));
    }, [currentWords, level]);

    useEffect(() => {
        setTreasurePositions(treasures.map(t => ({ word: t.word, position: t.position })));
    }, [treasures, setTreasurePositions]);

    return (
        <group>
            {instances.map((instance, i) => (
                <MasteryTree
                    key={i}
                    {...instance}
                />
            ))}

            {treasures.map((t) => (
                <Treasure
                    key={t.id}
                    word={t}
                    position={t.position}
                    onOpen={() => unlockWord(t)}
                    isFound={foundWords.includes(t.word)}
                />
            ))}
        </group>
    );
};

const MasteryTree = ({ position, scale, rotation, variant, seed }: any) => {
    const trunkTexture = useTexture('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/terrain/grasslight-big.jpg');
    const trunkRef = useRef<THREE.Mesh>(null!);
    const foliageRef = useRef<THREE.Group>(null!);

    const trunkGeom = useMemo(() => {
        const geo = new THREE.CylinderGeometry(0.15, 0.45, 5, 12, 12); // Taller trees
        const pos = geo.attributes.position;
        // Organic trunk displacement
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            const angle = Math.atan2(pos.getZ(i), pos.getX(i));
            const distortion = (Math.sin(y * 2 + seed) * 0.15) + (Math.cos(angle * 3 + seed) * 0.08);
            if (y > -2.5) {
                pos.setX(i, pos.getX(i) + distortion * Math.cos(angle));
                pos.setZ(i, pos.getZ(i) + distortion * Math.sin(angle));
            }
        }
        geo.computeVertexNormals();
        return geo;
    }, [seed]);

    // X-Ray / Transparency Logic
    useFrame((state: any) => {
        if (!trunkRef.current || !foliageRef.current) return;

        const treePos = new THREE.Vector3(position[0], position[1], position[2]);
        const camPos = state.camera.position;
        const distToCam = treePos.distanceTo(camPos);

        // Simple but effective: Fade trees that are very close to the camera 
        // OR are positioned between the camera and the center focus (approx player)
        let opacity = 1.0;
        if (distToCam < 8) {
            opacity = THREE.MathUtils.lerp(0.2, 1.0, (distToCam - 4) / 4);
        }

        opacity = Math.max(0.1, Math.min(1.0, opacity));

        const trunkMat = trunkRef.current.material as THREE.MeshStandardMaterial;
        trunkMat.opacity = opacity;
        trunkMat.transparent = opacity < 0.95;

        foliageRef.current.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                mat.opacity = opacity;
                mat.transparent = opacity < 0.95;
                mat.depthWrite = opacity > 0.5; // Avoid sorting artifacts if very transparent
            }
        });
    });

    return (
        <group position={position} scale={scale} rotation={rotation}>
            {/* Organic Trunk */}
            <mesh ref={trunkRef} geometry={trunkGeom} castShadow receiveShadow>
                <meshStandardMaterial
                    map={trunkTexture}
                    color="#3d2b1f"
                    roughness={0.9}
                    metalness={0.0}
                    normalScale={new THREE.Vector2(2, 2)}
                />
            </mesh>

            {/* Nested Lush Foliage Clusters */}
            <group ref={foliageRef} position={[0, 2.5, 0]}>
                <FoliageCluster color={variant === 0 ? "#14532d" : "#064e3b"} offset={seed} />
                <FoliageCluster color={variant === 0 ? "#166534" : "#065f46"} scale={0.8} position={[0, 1.5, 0]} offset={seed + 1} />
                <FoliageCluster color={variant === 0 ? "#064e3b" : "#14532d"} scale={0.6} position={[0, 2.8, 0]} offset={seed + 2} />
            </group>
        </group>
    );
};

const FoliageCluster = ({ color, scale = 1, position = [0, 0, 0], offset = 0 }: any) => {
    const geom = useMemo(() => {
        const geo = new THREE.IcosahedronGeometry(1.8, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const distortion = Math.sin(pos.getX(i) * 2 + offset) * 0.2 +
                Math.cos(pos.getY(i) * 2 + offset) * 0.2;
            pos.setX(i, pos.getX(i) + distortion);
            pos.setY(i, pos.getY(i) + distortion);
            pos.setZ(i, pos.getZ(i) + distortion);
        }
        geo.computeVertexNormals();
        return geo;
    }, [offset]);

    return (
        <mesh position={position} scale={scale} geometry={geom} castShadow>
            <meshStandardMaterial
                color={color}
                roughness={0.7}
                metalness={0.1}
                flatShading={false}
            />
        </mesh>
    );
};

const Treasure = ({ position, onOpen, isFound }: any) => {
    const handleClick = (e: any) => {
        e.stopPropagation();
        if (!isFound) onOpen();
    };

    if (isFound) return null;

    return (
        <group position={position} onClick={handleClick}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh castShadow>
                    <boxGeometry args={[1, 0.8, 1]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        metalness={0.9}
                        roughness={0.1}
                        emissive="#fbbf24"
                        emissiveIntensity={1.5}
                    />
                </mesh>
            </Float>
            <Sparkles count={20} scale={2} size={2} speed={0.4} color="#fbbf24" opacity={0.5} />
        </group>
    );
};
