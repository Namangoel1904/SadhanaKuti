const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  syllabus: { type: String, required: true },
  centerName: { type: String, required: true },
  centerAddress: { type: String, required: true },
  stream: { type: String, enum: ['PCM', 'PCB', 'BOTH'], required: true },
  feeAmount: { type: Number, default: 0 },
  qrImageUrl: { type: String, default: '' },
  subjectConfig: {
    section1: {
      partA: { label: { type: String, default: 'Physics' }, count: { type: Number, default: 50 } },
      partB: { label: { type: String, default: 'Chemistry' }, count: { type: Number, default: 50 } }
    },
    section2: {
      label: { type: String, default: 'Mathematics' } // or Biology
    }
  },
  isActive: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
