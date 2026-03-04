import { useState, useRef, useCallback, useEffect } from 'react';

const useMedia = () => {
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [] });

  // ─── Enumerate Devices ──────────────────────────────────────────────

  const getDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audioInputs: deviceList.filter((d) => d.kind === 'audioinput'),
        videoInputs: deviceList.filter((d) => d.kind === 'videoinput'),
      });
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, []);

  // ─── Get User Media ─────────────────────────────────────────────────

  const getUserMedia = useCallback(async (constraints = {}) => {
    setMediaLoading(true);
    setMediaError(null);
    try {
      const defaultConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        },
        ...constraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      await getDevices();
      setMediaLoading(false);
      return stream;
    } catch (err) {
      setMediaLoading(false);
      let message = 'Failed to access camera/microphone';
      if (err.name === 'NotAllowedError') message = 'Camera/microphone permission denied. Please allow access and try again.';
      else if (err.name === 'NotFoundError') message = 'No camera or microphone found.';
      else if (err.name === 'NotReadableError') message = 'Camera/microphone is already in use by another application.';
      else if (err.name === 'OverconstrainedError') message = 'Camera constraints not supported by your device.';
      setMediaError(message);
      console.error('getUserMedia error:', err);
      throw err;
    }
  }, [getDevices]);

  // ─── Audio Toggle ───────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setAudioEnabled((prev) => !prev);
    return !audioEnabled;
  }, [audioEnabled]);

  // ─── Video Toggle ───────────────────────────────────────────────────

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setVideoEnabled((prev) => !prev);
    return !videoEnabled;
  }, [videoEnabled]);

  // ─── Screen Share ───────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          logicalSurface: true,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      screenStreamRef.current = screen;
      setScreenStream(screen);
      setIsScreenSharing(true);

      // Handle user stopping via browser UI
      screen.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return screen;
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setMediaError('Failed to start screen sharing');
      }
      console.error('Screen share error:', err);
      throw err;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  }, []);

  // ─── Switch Device ──────────────────────────────────────────────────

  const switchDevice = useCallback(async (deviceId, kind) => {
    try {
      const constraints = kind === 'audio'
        ? { audio: { deviceId: { exact: deviceId } }, video: false }
        : { video: { deviceId: { exact: deviceId } }, audio: false };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = newStream.getTracks()[0];

      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getTracks().find((t) => t.kind === newTrack.kind);
        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current.addTrack(newTrack);
      }

      return newTrack;
    } catch (err) {
      console.error('Switch device error:', err);
      throw err;
    }
  }, []);

  // ─── Cleanup ────────────────────────────────────────────────────────

  const stopAllTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    return () => stopAllTracks();
  }, [stopAllTracks]);

  return {
    localStream,
    screenStream,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    mediaError,
    mediaLoading,
    devices,
    getUserMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchDevice,
    stopAllTracks,
  };
};

export default useMedia;
