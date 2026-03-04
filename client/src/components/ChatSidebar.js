import React, { useState, useRef, useEffect } from 'react';

const ChatSidebar = ({ messages, onSend, currentUser, onClose }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      width: '320px',
      height: '100%',
      background: '#0f0f1a',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Syne', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>Meeting Chat</span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '6px',
            color: '#aaa',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: '0.85rem', marginTop: '40px' }}>
            No messages yet.<br />Say hello! 👋
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderName === currentUser?.name;
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
            }}>
              {!isMe && (
                <span style={{ color: '#a78bfa', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px', paddingLeft: '4px' }}>
                  {msg.senderName}
                </span>
              )}
              <div style={{
                background: isMe
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'rgba(255,255,255,0.07)',
                color: '#fff',
                padding: '9px 14px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.85rem',
                maxWidth: '240px',
                wordBreak: 'break-word',
                lineHeight: '1.5',
              }}>
                {msg.message}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', marginTop: '4px', paddingLeft: '4px', paddingRight: '4px' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            color: '#fff',
            padding: '9px 14px',
            fontSize: '0.85rem',
            fontFamily: "'Syne', sans-serif",
            resize: 'none',
            outline: 'none',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            width: '40px',
            height: '40px',
            cursor: input.trim() ? 'pointer' : 'default',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
