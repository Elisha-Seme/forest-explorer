import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Word {
    word: string;
    meaning: string;
}

export type CameraMode = 'thirdPerson' | 'topDown' | 'birdsEye';
export type Quality = 'high' | 'low';

export interface GameState {
    score: number;
    foundWords: string[];
    currentWord: Word | null;
    isOverlayOpen: boolean;
    level: number;
    joystick: { x: number; y: number };
    cameraMode: CameraMode;
    quality: Quality;
    robotColor: string;
    isVoiceEnabled: boolean;
    treasurePositions: { word: string; position: [number, number, number] }[];
    playerPosition: { x: number; z: number };
    isStarted: boolean;

    // Actions
    startGame: () => void;
    setQuality: (quality: Quality) => void;
    addScore: (points: number) => void;
    unlockWord: (word: Word) => void;
    closeOverlay: () => void;
    nextLevel: () => void;
    resetGame: () => void;
    setJoystick: (x: number, y: number) => void;
    setCameraMode: (mode: CameraMode) => void;
    setRobotColor: (color: string) => void;
    setVoiceEnabled: (enabled: boolean) => void;
    setTreasurePositions: (positions: { word: string; position: [number, number, number] }[]) => void;
    setPlayerPosition: (x: number, z: number) => void;
}

export const ROBOT_COLORS = ['#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#c084fc', '#f472b6'];

export const useStore = create<GameState>()(
    persist(
        (set) => ({
            score: 0,
            foundWords: [],
            currentWord: null,
            isOverlayOpen: false,
            level: 1,
            joystick: { x: 0, y: 0 },
            cameraMode: 'thirdPerson',
            quality: (typeof window !== 'undefined' && (/Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768)) ? 'low' : 'high',
            robotColor: ROBOT_COLORS[1],
            isVoiceEnabled: true,
            treasurePositions: [],
            playerPosition: { x: 0, z: 0 },
            isStarted: false,

            startGame: () => set({ isStarted: true }),
            setQuality: (quality: Quality) => set({ quality }),
            addScore: (points: number) => set((state) => ({ score: state.score + points })),

            unlockWord: (word: Word) => set((state) => {
                if (state.foundWords.includes(word.word)) return state;
                return {
                    foundWords: [...state.foundWords, word.word],
                    currentWord: word,
                    isOverlayOpen: true,
                    score: state.score + 10,
                };
            }),

            closeOverlay: () => set({ isOverlayOpen: false, currentWord: null }),

            nextLevel: () => set((state) => ({
                level: state.level + 1,
                foundWords: [],
                currentWord: null,
                isOverlayOpen: false,
                treasurePositions: [],
                playerPosition: { x: 0, z: 0 },
            })),

            resetGame: () => set({
                score: 0,
                foundWords: [],
                currentWord: null,
                isOverlayOpen: false,
                level: 1,
                treasurePositions: [],
                playerPosition: { x: 0, z: 0 },
            }),

            setJoystick: (x: number, y: number) => set({ joystick: { x, y } }),
            setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
            setRobotColor: (color: string) => set({ robotColor: color }),
            setVoiceEnabled: (enabled: boolean) => set({ isVoiceEnabled: enabled }),
            setTreasurePositions: (positions: { word: string; position: [number, number, number] }[]) =>
                set({ treasurePositions: positions }),
            setPlayerPosition: (x: number, z: number) => set({ playerPosition: { x, z } }),
        }),
        {
            name: 'forest-explorer-storage',
            partialize: (state) => ({
                score: state.score,
                foundWords: state.foundWords,
                level: state.level,
                cameraMode: state.cameraMode,
                robotColor: state.robotColor,
                isVoiceEnabled: state.isVoiceEnabled,
            }),
        }
    )
);
