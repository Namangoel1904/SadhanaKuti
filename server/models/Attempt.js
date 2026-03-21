const mongoose = require('mongoose');

const sectionAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', ''], default: '' },
  markedForReview: { type: Boolean, default: false },
});

const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  section1Answers: [sectionAnswerSchema],
  section2Answers: [sectionAnswerSchema],
  section1Score: { type: Number, default: 0 },
  section2Score: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 200 },
  resultStatus: { type: String, enum: ['pending', 'published', 'hold'], default: 'pending' },
  submittedAt: { type: Date },
  startedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
