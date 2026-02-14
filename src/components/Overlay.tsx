import { useEffect } from 'react';
import { useStore, type Word } from '../store/useStore';
import { XCircle, Trophy, ArrowRight } from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';

export const Overlay = () => {
    const { isOverlayOpen, currentWord, closeOverlay, level, foundWords, nextLevel, isVoiceEnabled } = useStore();
    const { playChime, playSuccess } = useSoundEffects();

    const isLevelComplete = foundWords.length === 3;

    // Voice Synthesis Function
    const speakWord = (word: Word) => {
        if (!isVoiceEnabled) return;
        // Don't cancel immediately to avoid "cut short" feelings unless a NEW word is being spoken
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${word.word}. ${word.meaning}`);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (isOverlayOpen && currentWord) {
            if (isLevelComplete) {
                playSuccess();
            } else {
                playChime();
                // Delay slightly to ensure ambient chime doesn't overlap harshly
                const timer = setTimeout(() => speakWord(currentWord), 200);
                return () => clearTimeout(timer);
            }
        }
    }, [isOverlayOpen, isLevelComplete, currentWord]);

    // ESC key support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeOverlay();
        };
        if (isOverlayOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOverlayOpen, closeOverlay]);

    if (!isOverlayOpen || !currentWord) return null;

    return (
        <div className="overlay-wrapper" onClick={(e) => {
            if (e.target === e.currentTarget) closeOverlay();
        }}>
            <div className="overlay-card">
                <button className="close-btn" onClick={closeOverlay}>
                    <XCircle size={32} />
                </button>

                <div className="word-content">
                    <span className="treasure-tag">Vocabulary Treasure Found!</span>
                    <h1
                        className="word-title clickable"
                        onClick={() => speakWord(currentWord)}
                        title="Click to hear again"
                    >
                        {currentWord.word}
                    </h1>
                    <div className="divider" />
                    <p className="meaning-text" onClick={() => speakWord(currentWord)}>{currentWord.meaning}</p>
                </div>

                {isLevelComplete ? (
                    <div className="level-complete-section">
                        <div className="completion-badge">
                            <Trophy size={48} color="#fbbf24" />
                            <h2 className="completion-title">FOREST EXPLORED!</h2>
                        </div>
                        <button className="continue-btn next-level" onClick={nextLevel}>
                            GO TO LEVEL {level + 1} <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <button className="continue-btn" onClick={closeOverlay}>
                        CONTINUE EXPLORING
                    </button>
                )}
            </div>
        </div>
    );
};
