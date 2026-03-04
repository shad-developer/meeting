const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/rooms/create
router.post('/create', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const roomId = uuidv4().substring(0, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      name: name || `${req.user.name}'s Meeting`,
      host: req.user._id,
      participants: [{ user: req.user._id, role: 'host' }],
    });

    await room.populate('host', 'name email avatar');

    res.status(201).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/rooms/:roomId
router.get('/:roomId', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId, isActive: true })
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or has ended' });
    }

    if (room.isLocked) {
      const isParticipant = room.participants.some(
        (p) => p.user._id.toString() === req.user._id.toString() && p.isActive
      );
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: 'Room is locked' });
      }
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rooms/:roomId/join
router.post('/:roomId/join', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId, isActive: true });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const activeParticipants = room.participants.filter((p) => p.isActive);
    if (activeParticipants.length >= room.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    const existing = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (existing) {
      existing.isActive = true;
      existing.leftAt = null;
    } else {
      room.participants.push({ user: req.user._id, role: 'participant' });
    }

    await room.save();
    await room.populate('host', 'name email avatar');
    await room.populate('participants.user', 'name email avatar');

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rooms/:roomId/end
router.post('/:roomId/end', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can end the meeting' });
    }

    room.isActive = false;
    room.endedAt = Date.now();
    room.participants.forEach((p) => { p.isActive = false; });
    await room.save();

    res.json({ success: true, message: 'Meeting ended' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
