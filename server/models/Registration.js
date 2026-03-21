const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  paymentScreenshotUrl: { type: String, default: '' },
  mode: { type: String, enum: ['offline', 'online'], default: 'offline' },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  rollNumber: { type: String, default: '' },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
