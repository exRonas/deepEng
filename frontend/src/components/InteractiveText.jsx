import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './InteractiveText.css'; // We'll need some CSS for the spinner/popup

const Word = ({ text }) => {
    const [translation, setTranslation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef(null);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    const cleanWord = text.replace(/[.,!?;:()"']/g, '').toLowerCase();

    const handleMouseEnter = (e) => {
        // Only try to translate meaningful words (len > 1) or specific short words like I, a
        if (cleanWord.length < 2 && cleanWord !== 'i' && cleanWord !== 'a') return;

        setCoords({
            x: e.clientX,
            y: e.clientY
        });

        timerRef.current = setTimeout(async () => {
            setShowTooltip(true);
            setLoading(true);
            try {
                const res = await axios.get(`/api/dict/${cleanWord}`);
                setTranslation(res.data.translation);
            } catch (err) {
                setTranslation(null); // No translation found
            } finally {
                setLoading(false);
            }
        }, 1200); // 1.2s delay as requested (approx 1.5s)
    };

    const handleMouseMove = (e) => {
        setCoords({
            x: e.clientX,
            y: e.clientY
        });
    };

    const handleMouseLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowTooltip(false);
        setTranslation(null);
    };

    return (
        <span 
            className="interactive-word"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
        >
            {text}
            {showTooltip && ReactDOM.createPortal(
                <div className="word-tooltip" style={{
                    position: 'fixed',
                    left: coords.x + 15, // Offset directly
                    top: coords.y + 15,  // Offset directly
                    background: '#333',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                }}>
                    {loading ? (
                        <div className="spinner"></div> 
                    ) : (
                        translation || "No translation"
                    )}
                </div>,
                document.body
            )}
        </span>
    );
};

const InteractiveText = ({ content }) => {
    if (!content) return null;

    // Helper to process a string sentence
    const processString = (str) => {
        return str.split(' ').map((word, idx) => (
            <React.Fragment key={idx}>
                <Word text={word} />{' '}
            </React.Fragment>
        ));
    };

    // If text contains markdown-like bold (**text**), we need to split it
    const parts = content.split(/(\*\*.*?\*\*)/g);

    return (
        <span className="interactive-text">
            {parts.map((part, idx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Bold text, usually native language in our new content, or keywords
                    // Clean marks
                    const clean = part.slice(2, -2);
                    return <strong key={idx}>{processString(clean)}</strong>;
                } else {
                    return <span key={idx}>{processString(part)}</span>;
                }
            })}
        </span>
    );
};

export default InteractiveText;
