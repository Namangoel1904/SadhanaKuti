const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
});

const questionPaperSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  section: { type: Number, enum: [1, 2], required: true },
  questions: [questionSchema],
  docFileName: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
