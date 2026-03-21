const mongoose = require('mongoose');

const answerKeySchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  section: { type: Number, enum: [1, 2], required: true },
  // answers is an array where index matches question index
  answers: [{ type: String, enum: ['A', 'B', 'C', 'D'] }],
}, { timestamps: true });

module.exports = mongoose.model('AnswerKey', answerKeySchema);
