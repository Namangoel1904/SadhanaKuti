const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// Get exams (filtered by student stream or ALL for admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let filter = { isActive: true };
    if (req.user.role !== 'admin' && req.user.stream !== 'BOTH') {
      filter = { isActive: true, $or: [{ stream: req.user.stream }, { stream: 'BOTH' }] };
    }
    const exams = await Exam.find(filter).sort({ startDate: 1, date: 1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single exam
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create exam (admin)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update exam (admin)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete exam (admin)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Exam removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
