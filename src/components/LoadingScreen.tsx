import { useProgress } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';

export const LoadingScreen = () => {
    const { progress, active } = useProgress();
    const isStarted = useStore((state) => state.isStarted);
    const startGame = useStore((state) => state.startGame);
    const [isFinishing, setIsFinishing] = useState(false);

    // Ensure we don't flash the screen if it loads instantly
    useEffect(() => {
        if (!active && progress === 100) {
            const timer = setTimeout(() => setIsFinishing(true), 500);
            return () => clearTimeout(timer);
        }
    }, [active, progress]);

    if (isStarted) return null;

    return (
        <div className={`loading-screen ${isFinishing ? 'ready' : ''}`}>
            <div className="loading-content">
                <h1 className="loading-title">FOREST EXPLORER</h1>
                <div className="loading-bar-container">
                    <div
                        className="loading-bar-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="loading-text">
                    {progress < 100 ? `Gathering the leaves... ${Math.round(progress)}%` : 'The forest is ready.'}
                </p>

                {progress === 100 && (
                    <button className="start-button" onClick={startGame}>
                        ENTER THE FOREST
                    </button>
                )}
            </div>

            <style>{`
                .loading-screen {
                    position: fixed;
                    inset: 0;
                    background: #0a1a0b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    transition: opacity 1s ease-in-out;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .loading-content {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                }

                .loading-title {
                    color: #4ade80;
                    font-size: 3rem;
                    font-weight: 900;
                    letter-spacing: 0.2rem;
                    text-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
                    margin: 0;
                }

                .loading-bar-container {
                    width: 300px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .loading-bar-fill {
                    height: 100%;
                    background: #4ade80;
                    transition: width 0.3s ease-out;
                    box-shadow: 0 0 10px #4ade80;
                }

                .loading-text {
                    color: #888;
                    font-weight: 500;
                    letter-spacing: 0.05rem;
                }

                .start-button {
                    background: #4ade80;
                    color: #064e3b;
                    border: none;
                    padding: 1.2rem 2.5rem;
                    border-radius: 3rem;
                    font-weight: 800;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    animation: fadeIn 1s ease forwards, pulse 2s infinite;
                }

                .start-button:hover {
                    transform: scale(1.05);
                    background: #5bef91;
                    box-shadow: 0 0 30px rgba(74, 222, 128, 0.4);
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(74, 222, 128, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
                }
            `}</style>
        </div>
    );
};
