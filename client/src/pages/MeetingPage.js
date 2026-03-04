import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useMeeting from '../hooks/useMeeting';
import VideoGrid from '../components/VideoGrid';
import MeetingControls from '../components/MeetingControls';
import ChatSidebar from '../components/ChatSidebar';

const MeetingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const meeting = useMeeting({ socket, roomId, user });

  // Join on mount
  useEffect(() => {
    if (socket && roomId) {
      meeting.joinMeeting().catch((err) => {
        console.error('Failed to join:', err);
      });
    }
    return () => {
      meeting.leaveMeeting();
    };
  }, [socket, roomId]); // eslint-disable-line

  // Navigate away when meeting ends
  useEffect(() => {
    if (meeting.meetingEnded) {
      const timeout = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timeout);
    }
  }, [meeting.meetingEnded, navigate]);

  if (meeting.meetingEnded) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080812',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Syne', sans-serif',",
        color: '#fff',
        gap: '16px',
      }}>
        <div style={{ fontSize: '3rem' }}>👋</div>
        <h2 style={{ margin: 0, fontWeight: '800', fontSize: '1.8rem' }}>Meeting Ended</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{meeting.endReason}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontSize: '0.85rem' }}>Redirecting to home...</p>
      </div>
    );
  }

  if (meeting.mediaError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080812',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Syne', sans-serif",
        color: '#fff',
        gap: '20px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem' }}>📵</div>
        <h2 style={{ margin: 0, fontWeight: '800' }}>Media Access Required</h2>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          maxWidth: '400px',
          lineHeight: 1.6,
          margin: 0,
        }}>
          {meeting.mediaError}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => meeting.joinMeeting()}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              color: '#fff',
              padding: '12px 24px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!meeting.joined || meeting.mediaLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#080812',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Syne', sans-serif",
        color: '#fff',
        gap: '20px',
      }}>
        <div style={{
          width: '60px', height: '60px',
          border: '3px solid rgba(102,126,234,0.3)',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {meeting.mediaLoading ? 'Getting camera & microphone...' : 'Joining meeting...'}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', margin: 0, fontSize: '0.85rem' }}>
          Room: {roomId}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      background: '#080812',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Syne', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        height: '48px',
        background: 'rgba(10,10,20,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem',
          }}>🎥</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>
            {meeting.roomInfo?.name || 'Meeting'}
          </span>
          {meeting.isHost && (
            <span style={{
              background: 'rgba(167,139,250,0.2)',
              border: '1px solid rgba(167,139,250,0.4)',
              color: '#a78bfa',
              borderRadius: '5px',
              padding: '2px 7px',
              fontSize: '0.65rem',
              fontWeight: '700',
              letterSpacing: '0.08em',
            }}>
              HOST
            </span>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
          {meeting.connectionStatus === 'connected'
            ? <span style={{ color: '#4ade80' }}>● Connected</span>
            : <span style={{ color: '#f59e0b' }}>● {meeting.connectionStatus}</span>
          }
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Video area */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <VideoGrid
            localStream={meeting.localStream}
            localUser={user}
            audioEnabled={meeting.audioEnabled}
            videoEnabled={meeting.videoEnabled}
            isScreenSharing={meeting.isScreenSharing}
            screenStream={meeting.screenStream}
            remoteStreams={meeting.remoteStreams}
            isHost={meeting.isHost}
            onMuteParticipant={meeting.muteParticipant}
            onRemoveParticipant={meeting.removeParticipant}
          />
        </div>

        {/* Chat sidebar */}
        {meeting.chatOpen && (
          <ChatSidebar
            messages={meeting.messages}
            onSend={meeting.sendMessage}
            currentUser={user}
            onClose={() => meeting.setChatOpen(false)}
          />
        )}
      </div>

      {/* Controls */}
      <MeetingControls
        audioEnabled={meeting.audioEnabled}
        videoEnabled={meeting.videoEnabled}
        isScreenSharing={meeting.isScreenSharing}
        chatOpen={meeting.chatOpen}
        unreadCount={meeting.unreadCount}
        isHost={meeting.isHost}
        participantCount={meeting.participants.length || 1}
        onToggleAudio={meeting.toggleAudio}
        onToggleVideo={meeting.toggleVideo}
        onScreenShare={meeting.isScreenSharing ? meeting.stopScreenShare : meeting.startScreenShare}
        onToggleChat={() => meeting.setChatOpen((p) => !p)}
        onLeave={() => { meeting.leaveMeeting(); navigate('/'); }}
        onEnd={meeting.endMeeting}
        roomId={roomId}
      />
    </div>
  );
};

export default MeetingPage;
