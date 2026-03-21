const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const QuestionPaper = require('../models/QuestionPaper');
const AnswerKey = require('../models/AnswerKey');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// Setup multer for Word docs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/docs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

/**
 * Parse Word doc to questions array.
 * Expected format in Word doc:
 *   Q1. Question text here?
 *   A. Option A text
 *   *B. Option B text (correct answer marked with *)
 *   C. Option C text
 *   D. Option D text
 *   (blank line between questions)
 */
function parseQuestionsFromText(text) {
  const questions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentQ = null;

  for (let line of lines) {
    if (/^Q?\d+[\.\)]\s*/i.test(line)) {
      if (currentQ && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D) {
        questions.push(currentQ);
      }
      currentQ = {
        questionText: line.replace(/^Q?\d+[\.\)]\s*/i, '').trim(),
        options: { A: '', B: '', C: '', D: '' },
        _correct: null
      };
      continue;
    }

    if (!currentQ) continue;

    const isCorrect = line.startsWith('*');
    if (isCorrect) line = line.substring(1).trim();

    const match = line.match(/^([ABCD])[\.\)]\s*(.*)/i);
    if (match) {
      const optionKey = match[1].toUpperCase();
      currentQ.options[optionKey] = match[2].trim();
      if (isCorrect) currentQ._correct = optionKey;
    } else {
      // If no option has been parsed yet, it's a multiline question
      if (!currentQ.options.A && !currentQ.options.B) {
        currentQ.questionText += '\n' + line;
      }
    }
  }

  if (currentQ && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D) {
    questions.push(currentQ);
  }

  return questions;
}

// Upload question paper Word doc
router.post('/upload', authMiddleware, requireAdmin, upload.single('doc'), async (req, res) => {
  try {
    const { examId, section } = req.body;
    if (!examId || !section || !req.file) {
      return res.status(400).json({ message: 'examId, section and doc file required' });
    }

    const result = await mammoth.extractRawText({ path: req.file.path });
    const rawText = result.value;
    const parsedQuestions = parseQuestionsFromText(rawText);

    if (parsedQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions parsed. Check document format.' });
    }

    // Extract answer key along the way
    const answers = parsedQuestions.map(q => q._correct || '');
    const cleanQuestions = parsedQuestions.map(({ questionText, options }) => ({ questionText, options }));

    // Upsert question paper
    let qp = await QuestionPaper.findOne({ exam: examId, section: Number(section) });
    if (qp) {
      qp.questions = cleanQuestions;
      qp.docFileName = req.file.originalname;
      await qp.save();
    } else {
      qp = await QuestionPaper.create({
        exam: examId,
        section: Number(section),
        questions: cleanQuestions,
        docFileName: req.file.originalname,
      });
    }

    // Upsert answer key (if * markers found)
    if (answers.some(a => a)) {
      let ak = await AnswerKey.findOne({ exam: examId, section: Number(section) });
      if (ak) {
        ak.answers = answers;
        await ak.save();
      } else {
        await AnswerKey.create({ exam: examId, section: Number(section), answers });
      }
    }

    res.json({ message: 'Parsed successfully', totalQuestions: cleanQuestions.length, questions: cleanQuestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get question paper (admin preview)
router.get('/:examId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const sections = await QuestionPaper.find({ exam: req.params.examId }).sort({ section: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get question paper for student (exam in progress)
router.get('/:examId/student', authMiddleware, async (req, res) => {
  try {
    const sections = await QuestionPaper.find({ exam: req.params.examId }).sort({ section: 1 });
    // Don't expose correct answers
    const clean = sections.map(s => ({
      section: s.section,
      questions: s.questions.map(q => ({ questionText: q.questionText, options: q.options }))
    }));
    res.json(clean);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload / update answer key separately
router.post('/answerkey', authMiddleware, requireAdmin, upload.single('doc'), async (req, res) => {
  try {
    const { examId, section } = req.body;
    if (!req.file) return res.status(400).json({ message: 'doc file required' });

    const result = await mammoth.extractRawText({ path: req.file.path });
    const rawText = result.value;
    const parsedQuestions = parseQuestionsFromText(rawText);
    const answers = parsedQuestions.map(q => q._correct || '');

    let ak = await AnswerKey.findOne({ exam: examId, section: Number(section) });
    if (ak) {
      ak.answers = answers;
      await ak.save();
    } else {
      ak = await AnswerKey.create({ exam: examId, section: Number(section), answers });
    }

    res.json({ message: 'Answer key updated', count: answers.filter(Boolean).length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
