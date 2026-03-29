const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const AnswerKey = require('../models/AnswerKey');
const Registration = require('../models/Registration');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// Start exam attempt
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.body;
    // Verify registration is confirmed
    const reg = await Registration.findOne({ student: req.user._id, exam: examId, status: 'confirmed' });
    if (!reg) return res.status(403).json({ message: 'Registration not confirmed for this exam' });

    // Check if already attempted
    let attempt = await Attempt.findOne({ student: req.user._id, exam: examId });
    if (attempt && attempt.submittedAt) {
      return res.status(409).json({ message: 'Exam already submitted' });
    }

    if (!attempt) {
      attempt = await Attempt.create({ student: req.user._id, exam: examId });
    }

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tab-switch recording removed per request.


// Submit exam
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { examId, section1Answers, section2Answers } = req.body;
    const attempt = await Attempt.findOne({ student: req.user._id, exam: examId });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.submittedAt) return res.status(409).json({ message: 'Already submitted' });

    // Fetch answer keys
    const ak1 = await AnswerKey.findOne({ exam: examId, section: 1 });
    const ak2 = await AnswerKey.findOne({ exam: examId, section: 2 });

    // Score section 1 (Physics + Chemistry, 1 mark each)
    let s1Score = 0;
    const s1Answers = section1Answers || [];
    if (ak1) {
      s1Answers.forEach(ans => {
        const correct = ak1.answers[ans.questionIndex];
        if (correct && ans.selectedOption === correct) s1Score += 1;
      });
    }

    // Score section 2 (Maths 2 marks / Biology 1 mark — determined by exam stream)
    let s2Score = 0;
    const s2Answers = section2Answers || [];
    // Get exam config to determine weightage
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(examId);

    // Mathematics has 50 questions @ 2 marks each; Biology has 100 questions @ 1 mark each
    const isMaths = exam && (exam.stream === 'PCM' || exam.subjectConfig?.section2?.label === 'Mathematics' || exam.subjectConfig?.section2?.label?.includes('Math'));
    const marksPerQ = isMaths ? 2 : 1;

    if (ak2) {
      s2Answers.forEach(ans => {
        const correct = ak2.answers[ans.questionIndex];
        if (correct && ans.selectedOption === correct) s2Score += marksPerQ;
      });
    }

    attempt.section1Answers = s1Answers;
    attempt.section2Answers = s2Answers;
    attempt.section1Score = s1Score;
    attempt.section2Score = s2Score;
    attempt.totalScore = s1Score + s2Score;
    attempt.maxScore = 200;
    attempt.submittedAt = new Date();
    attempt.resultStatus = 'published';

    await attempt.save();

    res.json({
      totalScore: attempt.totalScore,
      section1Score: attempt.section1Score,
      section2Score: attempt.section2Score,
      resultStatus: attempt.resultStatus,
      maxScore: attempt.maxScore,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: get my results
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id })
      .populate('exam', 'title date stream subjectConfig')
      .sort({ submittedAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: get detailed attempt result
router.get('/my/:id/details', authMiddleware, async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id })
      .populate('exam', 'title date stream subjectConfig');
    
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (!attempt.submittedAt) return res.status(400).json({ message: 'Exam not yet submitted' });

    const QuestionPaper = require('../models/QuestionPaper');
    const qp1 = await QuestionPaper.findOne({ exam: attempt.exam._id, section: 1 });
    const qp2 = await QuestionPaper.findOne({ exam: attempt.exam._id, section: 2 });
    
    const ak1 = await AnswerKey.findOne({ exam: attempt.exam._id, section: 1 });
    const ak2 = await AnswerKey.findOne({ exam: attempt.exam._id, section: 2 });

    const processSection = (answers, qp, ak) => {
      if (!qp || !ak) return [];
      return qp.questions.map((q, idx) => {
        const studentAns = answers.find(a => a.questionIndex === idx);
        const selected = studentAns ? studentAns.selectedOption : '';
        const correct = ak.answers[idx] || '';
        return {
          questionIndex: idx,
          questionText: q.questionText,
          options: q.options,
          selectedOption: selected,
          correctOption: correct,
          isCorrect: selected !== '' && selected === correct,
          isAttempted: selected !== ''
        };
      });
    };

    const section1Details = processSection(attempt.section1Answers, qp1, ak1);
    const section2Details = processSection(attempt.section2Answers, qp2, ak2);

    res.json({
      attempt,
      section1Details,
      section2Details
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Admin: get all results
router.get('/admin', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const attempts = await Attempt.find({ submittedAt: { $exists: true } })
      .populate('student', 'name email stream batch')
      .populate('exam', 'title date stream')
      .sort({ submittedAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get single attempt detail (with screenshots)
router.get('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('student', 'name email stream batch')
      .populate('exam', 'title date stream');
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all students list
router.get('/admin/students', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const students = await User.find({ role: 'student' }).select('-passwordHash').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
