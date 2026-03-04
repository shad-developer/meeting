const User = require('./models/User');
const Room = require('./models/Room');
const jwt = require('jsonwebtoken');

// roomId => Map<socketId, { userId, name, peerId }>
const rooms = new Map();
// socketId => { userId, name, roomId }
const socketUserMap = new Map();

const setupSocketHandlers = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user.name}`);

    // Mark user online
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true, socketId: socket.id });

    // Broadcast updated online status
    socket.broadcast.emit('user:online', { userId: socket.user._id, name: socket.user.name });

    // ─── ROOM EVENTS ────────────────────────────────────────────

    socket.on('room:join', async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId, isActive: true });
        if (!room) {
          socket.emit('room:error', { message: 'Room not found or has ended' });
          return;
        }

        socket.join(roomId);

        if (!rooms.has(roomId)) rooms.set(roomId, new Map());
        const roomPeers = rooms.get(roomId);

        // Notify existing peers about new user
        const existingPeers = [];
        roomPeers.forEach((peer, peerSocketId) => {
          existingPeers.push({
            socketId: peerSocketId,
            userId: peer.userId,
            name: peer.name,
          });
          // Tell existing peer to initiate WebRTC offer to new user
          io.to(peerSocketId).emit('peer:new', {
            socketId: socket.id,
            userId: socket.user._id,
            name: socket.user.name,
          });
        });

        // Add current user to room map
        roomPeers.set(socket.id, {
          userId: socket.user._id.toString(),
          name: socket.user.name,
        });

        socketUserMap.set(socket.id, {
          userId: socket.user._id.toString(),
          name: socket.user.name,
          roomId,
        });

        // Send current peers to new user
        socket.emit('room:joined', {
          roomId,
          peers: existingPeers,
          userId: socket.user._id,
          name: socket.user.name,
        });

        // Notify all in room of updated participant list
        io.to(roomId).emit('room:participants', {
          count: roomPeers.size,
          participants: Array.from(roomPeers.entries()).map(([sid, data]) => ({
            socketId: sid,
            ...data,
          })),
        });
      } catch (err) {
        socket.emit('room:error', { message: err.message });
      }
    });

    // ─── WebRTC SIGNALING ────────────────────────────────────────

    // Caller sends offer to specific peer
    socket.on('webrtc:offer', ({ targetSocketId, offer, senderName }) => {
      io.to(targetSocketId).emit('webrtc:offer', {
        offer,
        fromSocketId: socket.id,
        senderName: senderName || socket.user.name,
      });
    });

    // Callee sends answer back
    socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc:answer', {
        answer,
        fromSocketId: socket.id,
      });
    });

    // ICE candidate exchange
    socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc:ice-candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ─── MEDIA STATE EVENTS ──────────────────────────────────────

    socket.on('media:toggle', ({ roomId, type, enabled }) => {
      socket.to(roomId).emit('peer:media-toggle', {
        socketId: socket.id,
        type, // 'audio' | 'video' | 'screen'
        enabled,
      });
    });

    socket.on('screen:share-started', ({ roomId }) => {
      socket.to(roomId).emit('peer:screen-share-started', { socketId: socket.id });
    });

    socket.on('screen:share-stopped', ({ roomId }) => {
      socket.to(roomId).emit('peer:screen-share-stopped', { socketId: socket.id });
    });

    // ─── CHAT ────────────────────────────────────────────────────

    socket.on('chat:message', async ({ roomId, message }) => {
      try {
        const chatEntry = {
          sender: socket.user._id,
          senderName: socket.user.name,
          message,
          timestamp: new Date(),
        };

        await Room.findOneAndUpdate(
          { roomId },
          { $push: { chatMessages: chatEntry } }
        );

        io.to(roomId).emit('chat:message', {
          ...chatEntry,
          socketId: socket.id,
        });
      } catch (err) {
        console.error('Chat error:', err);
      }
    });

    // ─── HOST CONTROLS ───────────────────────────────────────────

    socket.on('host:mute-participant', ({ roomId, targetSocketId }) => {
      io.to(targetSocketId).emit('host:force-mute');
    });

    socket.on('host:remove-participant', ({ roomId, targetSocketId }) => {
      io.to(targetSocketId).emit('host:kicked');
      handleLeaveRoom(socket.id, targetSocketId, roomId, io);
    });

    socket.on('host:end-meeting', ({ roomId }) => {
      io.to(roomId).emit('meeting:ended', { by: socket.user.name });
      rooms.delete(roomId);
    });

    socket.on('host:toggle-lock', ({ roomId, locked }) => {
      socket.to(roomId).emit('room:lock-status', { locked });
    });

    // ─── LEAVE / DISCONNECT ──────────────────────────────────────

    socket.on('room:leave', ({ roomId }) => {
      handleLeaveRoom(socket, socket.id, roomId, io);
    });

    socket.on('disconnect', async () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);

      const userData = socketUserMap.get(socket.id);
      if (userData?.roomId) {
        handleLeaveRoom(socket, socket.id, userData.roomId, io);
      }

      socketUserMap.delete(socket.id);
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false, socketId: null });
      socket.broadcast.emit('user:offline', { userId: socket.user._id });
    });
  });
};

function handleLeaveRoom(socket, socketId, roomId, io) {
  const roomPeers = rooms.get(roomId);
  if (roomPeers) {
    roomPeers.delete(socketId);
    if (roomPeers.size === 0) {
      rooms.delete(roomId);
    } else {
      // Notify remaining peers
      io.to(roomId).emit('peer:left', { socketId });
      io.to(roomId).emit('room:participants', {
        count: roomPeers.size,
        participants: Array.from(roomPeers.entries()).map(([sid, data]) => ({
          socketId: sid,
          ...data,
        })),
      });
    }
  }

  if (socket.leave) socket.leave(roomId);
}

module.exports = setupSocketHandlers;
