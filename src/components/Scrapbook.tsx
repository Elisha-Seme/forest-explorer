import { useStore } from '../store/useStore';
import { Book, X, Trophy, Lock } from 'lucide-react';

const VOCABULARY: Record<number, { word: string; meaning: string }[]> = {
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

export const Scrapbook = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const foundWords = useStore((state) => state.foundWords);

    if (!isOpen) return null;

    return (
        <div className="scrapbook-backdrop" onClick={onClose}>
            <div className="scrapbook-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <header className="scrapbook-header">
                    <Book size={32} />
                    <h1>Explorer's Scrapbook</h1>
                    <p>Collection of words found in the forest</p>
                </header>

                <div className="scrapbook-content">
                    {Object.entries(VOCABULARY).map(([level, words]) => (
                        <section key={level} className="level-section">
                            <h2>LEVEL {level}</h2>
                            <div className="words-grid">
                                {words.map((w) => {
                                    const isFound = foundWords.includes(w.word);
                                    return (
                                        <div key={w.word} className={`word-card ${isFound ? 'found' : 'locked'}`}>
                                            {isFound ? (
                                                <>
                                                    <Trophy size={16} className="found-icon" />
                                                    <h3>{w.word}</h3>
                                                    <p>{w.meaning}</p>
                                                </>
                                            ) : (
                                                <div className="card-locked-content">
                                                    <Lock size={20} />
                                                    <span>Discovery Pending</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};
