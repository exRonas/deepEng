import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Sparkles, Minimize2 } from 'lucide-react';
import FormattedText from './FormattedText';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я твой AI репетитор. Нужна помощь с грамматикой или словами?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        userLevel: 'A1',
        context: window.currentDeepEngContext || {}
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages([...newMessages, response.data]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="floating-chat-container">
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{ 
          width: '380px', 
          height: '600px', 
          background: '#FFFFFF', 
          borderRadius: '20px', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-light)',
          marginBottom: '1rem',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }} className="chat-window">
          {/* Header */}
          <div style={{ 
            padding: '1.25rem', 
            background: 'var(--primary)', 
            color: 'white',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
                <Sparkles size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem' }}>AI Tutor</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Powered by DeepSeek</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
              <Minimize2 size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{ 
                  background: msg.role === 'user' ? 'var(--primary)' : 'white',
                  color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {msg.role === 'assistant' ? (
                     <FormattedText text={msg.content} />
                  ) : (
                     msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.5rem 1rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                <div className="typing-indicator">...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', background: 'white', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#F3F4F6', padding: '0.5rem', borderRadius: '12px' }}>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about grammar, words..."
                style={{ 
                  flex: 1, 
                  padding: '0.5rem', 
                  border: 'none', 
                  background: 'transparent', 
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
              <button 
                onClick={sendMessage} 
                disabled={!input.trim()}
                style={{ 
                  padding: '0.5rem', 
                  background: input.trim() ? 'var(--primary)' : '#D1D5DB', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={18} color="white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          className="floating-chat-btn" 
          onClick={() => setIsOpen(true)}
          style={{ 
            borderRadius: '50px', 
            padding: '12px 24px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'var(--primary)', 
            border: 'none',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle color="white" size={24} />
          <span style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }} className="chat-btn-text">Ask AI Tutor</span>
        </button>
      )}

      <style>{`
        @media (max-width: 768px) {
          .floating-chat-container {
            bottom: 20px !important;
            right: 20px !important;
          }
          
          .chat-window {
            width: calc(100vw - 40px) !important;
            height: calc(100vh - 120px) !important;
            position: fixed;
            bottom: 90px;
            right: 20px;
          }

          .chat-btn-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;
