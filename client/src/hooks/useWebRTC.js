import { useRef, useState, useCallback, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN servers here for production:
    // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
  ],
  iceCandidatePoolSize: 10,
};

const useWebRTC = ({ socket, roomId, localStream }) => {
  // socketId => RTCPeerConnection
  const peerConnections = useRef({});
  // socketId => { stream, name, userId, audioEnabled, videoEnabled, isScreenSharing }
  const [remoteStreams, setRemoteStreams] = useState({});
  const pendingCandidates = useRef({}); // Queue ICE candidates before remote desc is set

  // ─── Create Peer Connection ─────────────────────────────────────────

  const createPeerConnection = useCallback((targetSocketId, targetName) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    console.log(`📡 Creating peer connection with: ${targetName} (${targetSocketId})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log(`🎥 Remote track received from ${targetSocketId}`);
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: {
          stream: remoteStream,
          name: targetName,
          audioEnabled: true,
          videoEnabled: true,
          isScreenSharing: false,
        },
      }));
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${targetSocketId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
      if (['disconnected', 'closed', 'failed'].includes(pc.connectionState)) {
        removePeer(targetSocketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE state with ${targetSocketId}: ${pc.iceConnectionState}`);
    };

    peerConnections.current[targetSocketId] = pc;
    return pc;
  }, [localStream, socket]);

  // ─── Create Offer (called by existing peers for new peer) ────────────

  const createOffer = useCallback(async (targetSocketId, targetName) => {
    try {
      const pc = createPeerConnection(targetSocketId, targetName);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      socket.emit('webrtc:offer', {
        targetSocketId,
        offer: pc.localDescription,
        senderName: targetName,
      });
      console.log(`📤 Offer sent to ${targetSocketId}`);
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, socket]);

  // ─── Handle Offer (new peer receives from existing) ──────────────────

  const handleOffer = useCallback(async ({ offer, fromSocketId, senderName }) => {
    try {
      const pc = createPeerConnection(fromSocketId, senderName);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      if (pendingCandidates.current[fromSocketId]) {
        for (const c of pendingCandidates.current[fromSocketId]) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        delete pendingCandidates.current[fromSocketId];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc:answer', {
        targetSocketId: fromSocketId,
        answer: pc.localDescription,
      });
      console.log(`📤 Answer sent to ${fromSocketId}`);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, socket]);

  // ─── Handle Answer ────────────────────────────────────────────────────

  const handleAnswer = useCallback(async ({ answer, fromSocketId }) => {
    try {
      const pc = peerConnections.current[fromSocketId];
      if (!pc) return;

      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`✅ Answer received from ${fromSocketId}`);

        // Flush queued ICE candidates
        if (pendingCandidates.current[fromSocketId]) {
          for (const c of pendingCandidates.current[fromSocketId]) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          delete pendingCandidates.current[fromSocketId];
        }
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, []);

  // ─── Handle ICE Candidate ─────────────────────────────────────────────

  const handleIceCandidate = useCallback(async ({ candidate, fromSocketId }) => {
    try {
      const pc = peerConnections.current[fromSocketId];
      if (!pc || !candidate) return;

      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue candidate until remote description is set
        if (!pendingCandidates.current[fromSocketId]) {
          pendingCandidates.current[fromSocketId] = [];
        }
        pendingCandidates.current[fromSocketId].push(candidate);
      }
    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  }, []);

  // ─── Remove Peer ──────────────────────────────────────────────────────

  const removePeer = useCallback((socketId) => {
    if (peerConnections.current[socketId]) {
      peerConnections.current[socketId].close();
      delete peerConnections.current[socketId];
    }
    delete pendingCandidates.current[socketId];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    console.log(`🗑️ Removed peer: ${socketId}`);
  }, []);

  // ─── Replace Track (for screen share switching) ───────────────────────

  const replaceTrack = useCallback(async (newTrack, kind) => {
    const promises = Object.values(peerConnections.current).map(async (pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    });
    await Promise.all(promises);
  }, []);

  // ─── Add Track to All Connections (for screen share) ─────────────────

  const addTrackToAll = useCallback((track, stream) => {
    Object.values(peerConnections.current).forEach((pc) => {
      pc.addTrack(track, stream);
    });
  }, []);

  // ─── Update Remote Peer Media State ──────────────────────────────────

  const updateRemotePeerState = useCallback((socketId, update) => {
    setRemoteStreams((prev) => ({
      ...prev,
      [socketId]: { ...prev[socketId], ...update },
    }));
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    pendingCandidates.current = {};
    setRemoteStreams({});
  }, []);

  return {
    peerConnections: peerConnections.current,
    remoteStreams,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    replaceTrack,
    addTrackToAll,
    updateRemotePeerState,
    cleanup,
  };
};

export default useWebRTC;
