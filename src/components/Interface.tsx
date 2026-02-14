import { useStore, type CameraMode, ROBOT_COLORS } from '../store/useStore';
import { useRef, useState, useEffect, useCallback, type TouchEvent, type MouseEvent } from 'react';
import { Settings, Camera, Map, User, Volume2, VolumeX, Palette, X, Book } from 'lucide-react';
import { Scrapbook } from './Scrapbook';

export const Interface = () => {
    const score = useStore((state) => state.score);
    const level = useStore((state) => state.level);
    const foundWords = useStore((state) => state.foundWords);
    const setJoystick = useStore((state) => state.setJoystick);
    const treasurePositions = useStore((state) => state.treasurePositions);
    const playerPosition = useStore((state) => state.playerPosition);
    const { cameraMode, setCameraMode, robotColor, setRobotColor, isVoiceEnabled, setVoiceEnabled } = useStore();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isScrapbookOpen, setIsScrapbookOpen] = useState(false);

    // Joystick state
    const joystickBaseRef = useRef<HTMLDivElement>(null);
    const [isJoystickActive, setIsJoystickActive] = useState(false);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

    const handleJoystickStart = (e: TouchEvent | MouseEvent) => {
        setIsJoystickActive(true);
        handleJoystickMove(e);
    };

    const handleJoystickMove = (e: any) => {
        if (!isJoystickActive || !joystickBaseRef.current) return;

        const touch = e.touches ? e.touches[0] : e;
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = rect.width / 2;

        const clampedDistance = Math.min(distance, maxRadius);
        const angle = Math.atan2(dy, dx);

        const x = Math.cos(angle) * (clampedDistance / maxRadius);
        const y = Math.sin(angle) * (clampedDistance / maxRadius);

        setJoystickPos({
            x: Math.cos(angle) * clampedDistance,
            y: Math.sin(angle) * clampedDistance
        });

        setJoystick(x, -y);
    };

    const handleJoystickEnd = () => {
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        setJoystick(0, 0);
    };

    useEffect(() => {
        if (isJoystickActive) {
            window.addEventListener('mousemove', handleJoystickMove);
            window.addEventListener('mouseup', handleJoystickEnd);
            window.addEventListener('touchmove', handleJoystickMove, { passive: false });
            window.addEventListener('touchend', handleJoystickEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleJoystickMove);
            window.removeEventListener('mouseup', handleJoystickEnd);
            window.removeEventListener('touchmove', handleJoystickMove);
            window.removeEventListener('touchend', handleJoystickEnd);
        };
    }, [isJoystickActive]);

    // UI Control helpers
    const toggleSettings = () => setIsSettingsOpen(prev => !prev);
    const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
    const toggleScrapbook = () => setIsScrapbookOpen(prev => !prev);
    const closeScrapbook = useCallback(() => setIsScrapbookOpen(false), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeSettings();
                closeScrapbook();
            }
        };
        if (isSettingsOpen || isScrapbookOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSettingsOpen, isScrapbookOpen, closeSettings, closeScrapbook]);

    const cameraModes: { id: CameraMode; label: string; icon: any }[] = [
        { id: 'thirdPerson', label: 'Follow', icon: <User size={18} /> },
        { id: 'topDown', label: 'Above', icon: <Map size={18} /> },
        { id: 'birdsEye', label: 'Sky', icon: <Camera size={18} /> },
    ];

    const getMapPos = (x: number, z: number) => {
        const left = ((x + 80) / 160) * 100;
        const top = ((z + 80) / 160) * 100;
        return {
            left: `${Math.max(0, Math.min(100, left))}%`,
            top: `${Math.max(0, Math.min(100, top))}%`
        };
    };

    return (
        <div className="interface">
            <div className="top-ui">
                <div className="top-stats">
                    <div className="score-card">
                        <span className="label">TREASURE POINTS</span>
                        <span className="value">{score}</span>
                    </div>

                    <div className="level-card">
                        <span className="label">FOREST LEVEL</span>
                        <span className="value">{level}</span>
                    </div>
                </div>

                <div className="top-actions" style={{ display: 'flex', alignItems: 'flex-start', pointerEvents: 'auto' }}>
                    <button className="collection-btn" onClick={toggleScrapbook}>
                        <Book size={24} />
                        <span className="keyboard-only">SCRAPBOOK</span>
                    </button>

                    <div className="mini-map-container" style={{ marginRight: '1.5rem' }}>
                        <div className="mini-map">
                            <div className="map-label">MAP</div>
                            {treasurePositions.map((t, i) => {
                                if (foundWords.includes(t.word)) return null;
                                const pos = getMapPos(t.position[0], t.position[2]);
                                return (
                                    <div
                                        key={i}
                                        className="map-treasure"
                                        style={pos}
                                    />
                                );
                            })}
                            <div
                                className="map-player"
                                style={{
                                    ...getMapPos(playerPosition.x, playerPosition.z),
                                    backgroundColor: robotColor
                                }}
                            />
                        </div>
                    </div>

                    <button
                        className={`settings-toggle ${isSettingsOpen ? 'active' : ''}`}
                        onClick={toggleSettings}
                        aria-label="Open Settings"
                    >
                        <Settings size={24} />
                    </button>
                </div>
            </div>

            <div className="progression-hint">
                Progress: <b>{foundWords.length} / 3</b> Treasures Found
            </div>

            <Scrapbook isOpen={isScrapbookOpen} onClose={closeScrapbook} />

            {isSettingsOpen && (
                <>
                    <div className="settings-backdrop" onClick={closeSettings} />
                    <div className="settings-panel">
                        <button className="panel-close-btn" onClick={closeSettings}>
                            <X size={20} />
                        </button>

                        <section className="settings-section">
                            <h3><Camera size={14} /> View</h3>
                            <div className="camera-options">
                                {cameraModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        className={`camera-btn ${cameraMode === mode.id ? 'active' : ''}`}
                                        onClick={() => setCameraMode(mode.id)}
                                    >
                                        {mode.icon}
                                        <span>{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="settings-section">
                            <h3><Palette size={14} /> Robot Color</h3>
                            <div className="color-options">
                                {ROBOT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className={`color-btn ${robotColor === color ? 'active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setRobotColor(color)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="settings-section">
                            <h3><Volume2 size={14} /> Voice Narrator</h3>
                            <button
                                className={`voice-toggle ${isVoiceEnabled ? 'active' : ''}`}
                                onClick={() => setVoiceEnabled(!isVoiceEnabled)}
                            >
                                {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                <span>{isVoiceEnabled ? 'On' : 'Off'}</span>
                            </button>
                        </section>
                    </div>
                </>
            )}

            {/* Mobile Joystick */}
            <div className="mobile-controls">
                <div
                    className="joystick-base"
                    ref={joystickBaseRef}
                    onMouseDown={handleJoystickStart}
                    onTouchStart={handleJoystickStart}
                >
                    <div
                        className="joystick-handle"
                        style={{
                            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                        }}
                    />
                </div>
            </div>

            <div className="controls-hint keyboard-only">
                Use <b>WASD</b> or <b>Arrows</b> to explore!
            </div>
        </div>
    );
};
