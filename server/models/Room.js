const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['host', 'participant'], default: 'participant' },
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [participantSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  maxParticipants: {
    type: Number,
    default: 10,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  chatMessages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      senderName: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
