import React, { useEffect, useRef } from 'react';

const VideoTile = ({
  stream,
  name,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
  isScreenSharing = false,
  isLarge = false,
  isSpeaking = false,
  onMute,
  onRemove,
  isHost = false,
  showControls = false,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#1a1a2e',
        borderRadius: '12px',
        overflow: 'hidden',
        border: isSpeaking ? '2px solid #4ade80' : '2px solid transparent',
        transition: 'border-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: isScreenSharing ? 'contain' : 'cover',
          display: videoEnabled && stream ? 'block' : 'none',
          transform: isLocal && !isScreenSharing ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Avatar fallback when video off */}
      {(!videoEnabled || !stream) && (
        <div
          style={{
            width: isLarge ? '96px' : '64px',
            height: isLarge ? '96px' : '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isLarge ? '2rem' : '1.4rem',
            fontWeight: '700',
            color: 'white',
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      )}

      {/* Name tag */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          color: '#fff',
          padding: '3px 10px',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontFamily: "'Syne', sans-serif",
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          maxWidth: 'calc(100% - 16px)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {isScreenSharing && (
          <span style={{ fontSize: '0.7rem' }}>🖥️</span>
        )}
        {name || 'Unknown'}{isLocal ? ' (You)' : ''}
        {!audioEnabled && (
          <span style={{ color: '#f87171', marginLeft: '4px' }}>🔇</span>
        )}
      </div>

      {/* Host controls overlay */}
      {isHost && !isLocal && showControls && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {onMute && (
            <button
              onClick={onMute}
              title="Mute participant"
              style={{
                background: 'rgba(0,0,0,0.7)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🔇
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              title="Remove participant"
              style={{
                background: 'rgba(239,68,68,0.8)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Screen share label */}
      {isScreenSharing && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(99,102,241,0.85)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: '700',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          SCREEN
        </div>
      )}
    </div>
  );
};

export default VideoTile;
