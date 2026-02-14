import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { useSoundEffects } from '../hooks/useSoundEffects';
import * as THREE from 'three';

const MOVE_SPEED = 4.5;
const MODEL_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

export const Player = () => {
    const group = useRef<THREE.Group>(null!);
    const lastSyncedPosition = useRef<THREE.Vector3>(new THREE.Vector3());
    const { forward, backward, left, right } = useKeyboard();
    const joystick = useStore((state) => state.joystick);
    const cameraMode = useStore((state) => state.cameraMode);
    const robotColor = useStore((state) => state.robotColor);
    const setPlayerPosition = useStore((state) => state.setPlayerPosition);
    const { playStep, startAmbient } = useSoundEffects();
    const lastStepTime = useRef(0);

    // Orbit/Rotation state
    const [rotation, setRotation] = useState(0);
    const isDragging = useRef(false);
    const lastMouseX = useRef(0);

    const { scene, animations } = useGLTF(MODEL_URL);
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                material.roughness = 0.4;
                material.metalness = 0.7;
                if (material.name === 'Main' || material.name === 'Grey' || material.name === 'Body') {
                    material.color.set(robotColor);
                }
                if (material.name === 'Eye') {
                    material.emissive = new THREE.Color(robotColor);
                    material.emissiveIntensity = 2.0;
                }
            }
        });
    }, [scene, robotColor]);

    useEffect(() => {
        const isMoving = forward || backward || left || right || Math.abs(joystick.x) > 0.1 || Math.abs(joystick.y) > 0.1;
        const walkName = actions['Walking'] ? 'Walking' : animations[1]?.name;
        const idleName = actions['Idle'] ? 'Idle' : animations[0]?.name;
        const next = isMoving ? walkName : idleName;
        if (next && actions[next]) actions[next]!.reset().fadeIn(0.2).play();
        return () => { actions[next]?.fadeOut(0.2); };
    }, [forward, backward, left, right, joystick, animations, actions]);

    // Handle Rotation Integration via Window events for global support
    useEffect(() => {
        const down = (e: any) => {
            isDragging.current = true;
            lastMouseX.current = e.touches ? e.touches[0].clientX : e.clientX;
        };
        const move = (e: any) => {
            if (!isDragging.current) return;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const delta = x - lastMouseX.current;
            setRotation(prev => prev - delta * 0.005);
            lastMouseX.current = x;
        };
        const up = () => { isDragging.current = false; };

        window.addEventListener('mousedown', down);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchstart', down);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', up);
        return () => {
            window.removeEventListener('mousedown', down);
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchstart', down);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, []);

    useFrame((state, delta) => {
        if (!group.current) return;

        let moveZ = (forward ? -1 : 0) + (backward ? 1 : 0);
        let moveX = (left ? -1 : 0) + (right ? 1 : 0);
        if (Math.abs(joystick.x) > 0.1 || Math.abs(joystick.y) > 0.1) {
            moveX = joystick.x;
            moveZ = -joystick.y;
        }

        if (moveZ !== 0 || moveX !== 0) {
            // Apply rotation to movement vector so character moves relative to camera view
            const direction = new THREE.Vector3(moveX, 0, moveZ).normalize();
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

            group.current.position.addScaledVector(direction, MOVE_SPEED * delta);
            const targetAngle = Math.atan2(direction.x, direction.z);
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetAngle, 0.15);

            if (group.current.position.distanceTo(lastSyncedPosition.current) > 0.5) {
                setPlayerPosition(group.current.position.x, group.current.position.z);
                lastSyncedPosition.current.copy(group.current.position);
            }

            if (state.clock.elapsedTime - lastStepTime.current > 0.35) {
                playStep();
                lastStepTime.current = state.clock.elapsedTime;
                startAmbient();
            }
        }

        // Camera Follow 2.0 (Macro Scale + Free Rotation)
        const distance = cameraMode === 'thirdPerson' ? 18 : (cameraMode === 'topDown' ? 25 : 35);
        const height = cameraMode === 'thirdPerson' ? 10 : (cameraMode === 'topDown' ? 20 : 35);

        const idealPos = new THREE.Vector3(
            Math.sin(rotation) * distance,
            height,
            Math.cos(rotation) * distance
        ).add(group.current.position);

        state.camera.position.lerp(idealPos, 0.08);
        state.camera.lookAt(group.current.position.x, group.current.position.y + 1, group.current.position.z);
    });

    return (
        <group ref={group}>
            <primitive object={scene} scale={0.4} castShadow />
        </group>
    );
};

useGLTF.preload(MODEL_URL);
