const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImageUrl: { type: String, default: '' },
  options: {
    A: { text: { type: String, required: true }, imageUrl: { type: String, default: '' } },
    B: { text: { type: String, required: true }, imageUrl: { type: String, default: '' } },
    C: { text: { type: String, required: true }, imageUrl: { type: String, default: '' } },
    D: { text: { type: String, required: true }, imageUrl: { type: String, default: '' } },
  },
});


const questionPaperSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  section: { type: Number, enum: [1, 2], required: true },
  questions: [questionSchema],
  docFileName: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('QuestionPaper', questionPaperSchema);
