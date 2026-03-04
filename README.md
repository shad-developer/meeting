# 🎥 MeetApp — MERN + WebRTC Video Meeting Application

A full-featured video meeting application built with **MongoDB, Express, React, Node.js** and **WebRTC**, supporting 1-on-1 calls, group meetings, screen sharing, and live chat.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI

### 1. Clone / Setup

```bash
# Install all dependencies
cd meetapp
npm run install:all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your values:
#   MONGO_URI=mongodb://localhost:27017/meetapp
#   JWT_SECRET=your_secure_secret_here
#   CLIENT_URL=http://localhost:3000
```

### 3. Run Development Servers

```bash
# From root - runs both server and client
npm run dev

# OR separately:
npm run dev:server   # Backend on :5000
npm run dev:client   # Frontend on :3000
```

---

## 📁 Project Structure

```
meetapp/
├── server/                     # Express + Socket.io backend
│   ├── index.js                # Entry point - Express + Socket.io setup
│   ├── socket.js               # All socket event handlers (WebRTC signaling)
│   ├── models/
│   │   ├── User.js             # User model with bcrypt password
│   │   └── Room.js             # Room model with participants & chat
│   ├── routes/
│   │   ├── auth.js             # Register, login, /me, get users
│   │   └── rooms.js            # Create, join, get, end rooms
│   ├── middleware/
│   │   └── auth.js             # JWT protect middleware
│   └── .env.example
│
└── client/                     # React frontend
    └── src/
        ├── context/
        │   ├── AuthContext.js  # JWT auth state + axios instance
        │   └── SocketContext.js # Socket.io connection management
        ├── hooks/
        │   ├── useMedia.js     # Camera, mic, screen share with error handling
        │   ├── useWebRTC.js    # RTCPeerConnection, offer/answer, ICE
        │   └── useMeeting.js   # Orchestrates media + WebRTC + socket
        ├── components/
        │   ├── VideoTile.js    # Single video feed with avatar fallback
        │   ├── VideoGrid.js    # Dynamic grid layout (1-on-1 to group)
        │   ├── ChatSidebar.js  # Meeting chat panel
        │   └── MeetingControls.js # Bottom controls toolbar
        └── pages/
            ├── AuthPage.js     # Login / Register
            ├── HomePage.js     # Lobby - create or join meeting
            └── MeetingPage.js  # Full meeting room UI
```

---

## 🏗️ Architecture & WebRTC Flow

### How WebRTC Signaling Works

```
User A joins room                User B joins room
       │                                │
       ├─── socket: room:join ──────────┤
       │                                │
       │◄── socket: room:joined ────────┤  (A gets list of existing peers)
       │                                │
       │◄── socket: peer:new ───────────┤  (B tells A: new peer joined)
       │                                │
A creates RTCPeerConnection             │
A creates Offer                         │
       │─── socket: webrtc:offer ──────►│
       │                                │
       │              B creates RTCPeerConnection
       │              B sets remote description
       │              B creates Answer
       │◄── socket: webrtc:answer ──────│
       │                                │
A sets remote description               │
       │                                │
   ┌───┴───┐    ICE candidates     ┌────┴────┐
   │       │◄──────────────────────│         │
   │   A   │──────────────────────►│    B    │
   │       │   (both directions)   │         │
   └───────┘                       └─────────┘
         DIRECT P2P MEDIA STREAM
```

### Group Call Strategy (Mesh Network)
- Each participant creates a peer connection with **every other** participant
- Suitable for small-medium groups (2-8 people)
- For large groups (10+), consider SFU (Mediasoup, Janus) — see Production Notes

### Screen Share Flow
1. `getDisplayMedia()` captures screen stream
2. Video track in all peer connections is replaced via `sender.replaceTrack()`
3. Socket event notifies all peers to show screen-share indicator
4. On stop: camera track restored via `replaceTrack()` again

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT with bcrypt, 7-day expiry, auto-logout on 401 |
| **Create Meeting** | Generates unique 8-char Room ID |
| **Join Meeting** | Join by Room ID, validates room exists |
| **Video Call** | HD 720p/1080p, mirror effect on local |
| **Audio Call** | Echo cancellation, noise suppression, auto gain |
| **Screen Share** | Full monitor/window/tab with audio |
| **Group Calls** | Dynamic grid layout (1, 2, 4, 6, 9, 12 tiles) |
| **Live Chat** | Real-time messages saved to MongoDB |
| **Host Controls** | Mute participants, remove participants, end meeting |
| **Media Toggle** | Mute/unmute, camera on/off with state sync |
| **Room Lock** | Host can lock room to prevent new joins |
| **ICE Handling** | Candidate queuing until remote desc is set |
| **Reconnection** | ICE restart on connection failure |
| **Device Switching** | Switch mic/camera via device enumeration |

---

## 🔧 Key Technical Decisions

### ICE Candidate Queuing
ICE candidates can arrive before `setRemoteDescription()` completes. The app queues them in `pendingCandidates` and flushes after remote description is set:

```javascript
if (pc.remoteDescription) {
  await pc.addIceCandidate(candidate);
} else {
  pendingCandidates[socketId].push(candidate);
}
```

### Media Constraints
Optimized for quality and compatibility:
```javascript
audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
```

### Screen Share + Camera Restore
Uses `RTCRtpSender.replaceTrack()` instead of renegotiating — faster and no ICE restart needed.

---

## 🌐 Production Deployment

### 1. Add TURN Server (Required for NAT traversal)
In `useWebRTC.js`, add TURN servers to ICE config:
```javascript
{
  urls: 'turn:your-turn-server.com:3478',
  username: 'username',
  credential: 'password'
}
```
Free TURN: [Metered.ca](https://www.metered.ca/tools/openrelay/) or deploy [coturn](https://github.com/coturn/coturn).

### 2. Environment Variables
```env
# Server
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=strong_random_secret
CLIENT_URL=https://yourdomain.com
NODE_ENV=production

# Client (.env)
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

### 3. Scale to Large Groups
For 10+ participants, replace mesh WebRTC with an **SFU** (Selective Forwarding Unit):
- [Mediasoup](https://mediasoup.org/) — Node.js SFU
- [LiveKit](https://livekit.io/) — Managed SFU
- [Janus](https://janus.conf.meetecho.com/) — C-based SFU

### 4. Deploy
- **Backend**: Railway, Render, AWS EC2, DigitalOcean
- **Frontend**: Vercel, Netlify, or same server
- **Database**: MongoDB Atlas
- **HTTPS**: Required for WebRTC in production (getUserMedia only works on HTTPS)

---

## 🐛 Common Issues

| Issue | Fix |
|---|---|
| Camera/mic not working | Ensure HTTPS in production; allow browser permissions |
| Peers can't connect | Add TURN server for NAT traversal |
| Black video | Check `videoEnabled` state and track.enabled |
| Echo | echoCancellation is enabled by default in constraints |
| Can't join room | Verify MongoDB is running and MONGO_URI is correct |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |
| GET | `/api/auth/users` | List all users (auth required) |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rooms/create` | Create meeting room |
| GET | `/api/rooms/:roomId` | Get room info |
| POST | `/api/rooms/:roomId/join` | Join room |
| POST | `/api/rooms/:roomId/end` | End meeting (host only) |

### Socket Events
| Event (emit) | Payload | Description |
|---|---|---|
| `room:join` | `{ roomId }` | Join socket room |
| `room:leave` | `{ roomId }` | Leave socket room |
| `webrtc:offer` | `{ targetSocketId, offer }` | Send WebRTC offer |
| `webrtc:answer` | `{ targetSocketId, answer }` | Send WebRTC answer |
| `webrtc:ice-candidate` | `{ targetSocketId, candidate }` | Send ICE candidate |
| `media:toggle` | `{ roomId, type, enabled }` | Notify media state change |
| `screen:share-started` | `{ roomId }` | Notify screen share start |
| `chat:message` | `{ roomId, message }` | Send chat message |
| `host:mute-participant` | `{ roomId, targetSocketId }` | Mute a participant |
| `host:remove-participant` | `{ roomId, targetSocketId }` | Remove a participant |
| `host:end-meeting` | `{ roomId }` | End meeting for all |
