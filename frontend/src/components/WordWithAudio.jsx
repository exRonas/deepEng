import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

const WordWithAudio = ({ word, translation, audioUrl, definition }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const playAudio = () => {
        if (!audioUrl) return;
        
        const audio = new Audio(audioUrl);
        
        setIsPlaying(true);
        audio.play()
            .then(() => {
                // Audio started
            })
            .catch(err => {
                console.error("Audio play error:", err);
                setIsPlaying(false);
            });

        audio.onended = () => setIsPlaying(false);
    };

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.5rem', 
            background: '#F0F9FF', 
            borderRadius: '8px',
            border: '1px solid #BAE6FD',
            margin: '0.25rem 0'
        }}>
            <button 
                onClick={playAudio}
                style={{
                    background: isPlaying ? '#3B82F6' : 'white',
                    color: isPlaying ? 'white' : '#3B82F6',
                    border: '1px solid #3B82F6',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Volume2 size={16} />
            </button>
            
            <div style={{ fontSize: '1.1rem' }}>
                <strong>{word}</strong> <span style={{ color: '#6B7280' }}>— {translation}</span>
            </div>

            {definition && (
                <div style={{ 
                    color: '#6B7280', 
                    fontStyle: 'italic', 
                    borderLeft: '1px solid #BAE6FD', 
                    paddingLeft: '1rem',
                    marginLeft: '0.5rem'
                }}>
                    {definition}
                </div>
            )}
        </div>
    );
};

export default WordWithAudio;
