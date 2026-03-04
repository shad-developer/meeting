import React from 'react';

const ControlBtn = ({ onClick, active, danger, disabled, title, children, badge }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: danger
        ? '#ef4444'
        : active
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(255,255,255,0.07)',
      border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
      borderRadius: '14px',
      color: danger ? '#fff' : active ? '#fff' : 'rgba(255,255,255,0.7)',
      width: '52px',
      height: '52px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.3rem',
      fontFamily: "'Syne', sans-serif",
      transition: 'all 0.15s',
      position: 'relative',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (!disabled) e.currentTarget.style.transform = 'scale(1.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    {children}
    {badge > 0 && (
      <span style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        background: '#ef4444',
        color: '#fff',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        fontSize: '0.6rem',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #0f0f1a',
      }}>
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

const MeetingControls = ({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  chatOpen,
  unreadCount,
  isHost,
  participantCount,
  onToggleAudio,
  onToggleVideo,
  onScreenShare,
  onToggleChat,
  onLeave,
  onEnd,
  roomId,
}) => {
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div style={{
      height: '80px',
      background: 'rgba(10,10,20,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      gap: '12px',
      flexShrink: 0,
    }}>
      {/* Left - Room info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
        <div
          onClick={copyRoomId}
          title="Click to copy Room ID"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: '600', letterSpacing: '0.1em' }}>ROOM ID</div>
          <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.05em' }}>{roomId}</div>
        </div>
        <div style={{
          background: 'rgba(74,222,128,0.15)',
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '6px',
          padding: '4px 8px',
          color: '#4ade80',
          fontSize: '0.72rem',
          fontWeight: '700',
          fontFamily: "'Syne', sans-serif",
        }}>
          👥 {participantCount}
        </div>
      </div>

      {/* Center - Main controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ControlBtn
          onClick={onToggleAudio}
          active={audioEnabled}
          title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {audioEnabled ? '🎙️' : '🔇'}
        </ControlBtn>

        <ControlBtn
          onClick={onToggleVideo}
          active={videoEnabled}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? '📷' : '📵'}
        </ControlBtn>

        <ControlBtn
          onClick={isScreenSharing ? onScreenShare : onScreenShare}
          active={isScreenSharing}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? '🛑' : '🖥️'}
        </ControlBtn>

        <ControlBtn
          onClick={onToggleChat}
          active={chatOpen}
          badge={unreadCount}
          title="Toggle chat"
        >
          💬
        </ControlBtn>

        {/* Leave / End */}
        {isHost ? (
          <ControlBtn
            onClick={onEnd}
            danger
            title="End meeting for everyone"
          >
            📵
          </ControlBtn>
        ) : (
          <ControlBtn
            onClick={onLeave}
            danger
            title="Leave meeting"
          >
            📞
          </ControlBtn>
        )}
      </div>

      {/* Right */}
      <div style={{ minWidth: '160px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.72rem',
          fontFamily: "'Syne', sans-serif",
          textAlign: 'right',
        }}>
          <div style={{ color: '#4ade80', fontWeight: '700' }}>● LIVE</div>
          <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>
  );
};

export default MeetingControls;
