import { useState, useEffect, useCallback, useRef } from 'react';
import useWebRTC from './useWebRTC';
import useMedia from './useMedia';
import { api } from '../context/AuthContext';

const useMeeting = ({ socket, roomId, user }) => {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const media = useMedia();

  const webrtc = useWebRTC({
    socket,
    roomId,
    localStream: media.localStream,
  });

  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;

  // ─── Join Meeting ──────────────────────────────────────────────────

  const joinMeeting = useCallback(async () => {
    if (!socket || !roomId) return;
    try {
      // Get media first
      await media.getUserMedia();

      // Join room via API
      const { data } = await api.post(`/rooms/${roomId}/join`);
      setRoomInfo(data.room);
      setIsHost(data.room.host._id === user?._id);

      // Join socket room
      socket.emit('room:join', { roomId });
    } catch (err) {
      console.error('Join meeting error:', err);
      throw err;
    }
  }, [socket, roomId, user, media]);

  // ─── Leave Meeting ─────────────────────────────────────────────────

  const leaveMeeting = useCallback(() => {
    socket?.emit('room:leave', { roomId });
    webrtc.cleanup();
    media.stopAllTracks();
    setJoined(false);
    setParticipants([]);
  }, [socket, roomId, webrtc, media]);

  // ─── End Meeting (host) ────────────────────────────────────────────

  const endMeeting = useCallback(async () => {
    try {
      await api.post(`/rooms/${roomId}/end`);
      socket?.emit('host:end-meeting', { roomId });
      leaveMeeting();
    } catch (err) {
      console.error('End meeting error:', err);
    }
  }, [api, roomId, socket, leaveMeeting]);

  // ─── Send Chat Message ─────────────────────────────────────────────

  const sendMessage = useCallback((message) => {
    if (!message.trim() || !socket) return;
    socket.emit('chat:message', { roomId, message: message.trim() });
  }, [socket, roomId]);

  // ─── Toggle Audio/Video ────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    const enabled = media.toggleAudio();
    socket?.emit('media:toggle', { roomId, type: 'audio', enabled });
  }, [media, socket, roomId]);

  const toggleVideo = useCallback(() => {
    const enabled = media.toggleVideo();
    socket?.emit('media:toggle', { roomId, type: 'video', enabled });
  }, [media, socket, roomId]);

  // ─── Screen Share ──────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await media.startScreenShare();
      const videoTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      await webrtc.replaceTrack(videoTrack, 'video');
      socket?.emit('screen:share-started', { roomId });
    } catch (err) {
      console.error('Screen share error:', err);
    }
  }, [media, webrtc, socket, roomId]);

  const stopScreenShare = useCallback(async () => {
    media.stopScreenShare();
    // Restore camera track
    if (media.localStream) {
      const cameraTrack = media.localStream.getVideoTracks()[0];
      if (cameraTrack) {
        await webrtc.replaceTrack(cameraTrack, 'video');
      }
    }
    socket?.emit('screen:share-stopped', { roomId });
  }, [media, webrtc, socket, roomId]);

  // ─── Host Controls ─────────────────────────────────────────────────

  const muteParticipant = useCallback((targetSocketId) => {
    socket?.emit('host:mute-participant', { roomId, targetSocketId });
  }, [socket, roomId]);

  const removeParticipant = useCallback((targetSocketId) => {
    socket?.emit('host:remove-participant', { roomId, targetSocketId });
  }, [socket, roomId]);

  // ─── Socket Event Listeners ────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    // Successfully joined room - get existing peers
    socket.on('room:joined', ({ peers, userId, name }) => {
      setJoined(true);
      setConnectionStatus('connected');
      console.log(`🏠 Joined room. Existing peers: ${peers.length}`);

      // For each existing peer, they will send us an offer (triggered by peer:new on their side)
    });

    // New peer joined - we (existing peer) create offer for them
    socket.on('peer:new', ({ socketId, userId, name }) => {
      console.log(`👋 New peer: ${name} (${socketId})`);
      webrtc.createOffer(socketId, name);
    });

    // WebRTC signaling
    socket.on('webrtc:offer', webrtc.handleOffer);
    socket.on('webrtc:answer', webrtc.handleAnswer);
    socket.on('webrtc:ice-candidate', webrtc.handleIceCandidate);

    // Peer left
    socket.on('peer:left', ({ socketId }) => {
      webrtc.removePeer(socketId);
    });

    // Participants update
    socket.on('room:participants', ({ participants: parts }) => {
      setParticipants(parts);
    });

    // Remote media toggle
    socket.on('peer:media-toggle', ({ socketId, type, enabled }) => {
      webrtc.updateRemotePeerState(socketId, {
        [`${type}Enabled`]: enabled,
      });
    });

    // Screen share events
    socket.on('peer:screen-share-started', ({ socketId }) => {
      webrtc.updateRemotePeerState(socketId, { isScreenSharing: true });
    });
    socket.on('peer:screen-share-stopped', ({ socketId }) => {
      webrtc.updateRemotePeerState(socketId, { isScreenSharing: false });
    });

    // Chat
    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!chatOpenRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Host controls
    socket.on('host:force-mute', () => {
      if (media.audioEnabled) media.toggleAudio();
    });

    socket.on('host:kicked', () => {
      setMeetingEnded(true);
      setEndReason('You have been removed from the meeting.');
      leaveMeeting();
    });

    socket.on('meeting:ended', ({ by }) => {
      setMeetingEnded(true);
      setEndReason(`Meeting ended by ${by}`);
      webrtc.cleanup();
      media.stopAllTracks();
    });

    socket.on('room:error', ({ message }) => {
      console.error('Room error:', message);
      setConnectionStatus('error');
    });

    return () => {
      socket.off('room:joined');
      socket.off('peer:new');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('peer:left');
      socket.off('room:participants');
      socket.off('peer:media-toggle');
      socket.off('peer:screen-share-started');
      socket.off('peer:screen-share-stopped');
      socket.off('chat:message');
      socket.off('host:force-mute');
      socket.off('host:kicked');
      socket.off('meeting:ended');
      socket.off('room:error');
    };
  }, [socket, webrtc, media, leaveMeeting]);

  // Reset unread on chat open
  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  return {
    // State
    joined,
    participants,
    messages,
    meetingEnded,
    endReason,
    isHost,
    roomInfo,
    unreadCount,
    chatOpen,
    connectionStatus,

    // Media
    localStream: media.localStream,
    screenStream: media.screenStream,
    audioEnabled: media.audioEnabled,
    videoEnabled: media.videoEnabled,
    isScreenSharing: media.isScreenSharing,
    mediaError: media.mediaError,
    mediaLoading: media.mediaLoading,
    devices: media.devices,

    // Remote streams
    remoteStreams: webrtc.remoteStreams,

    // Actions
    joinMeeting,
    leaveMeeting,
    endMeeting,
    sendMessage,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    muteParticipant,
    removeParticipant,
    setChatOpen,
  };
};

export default useMeeting;
