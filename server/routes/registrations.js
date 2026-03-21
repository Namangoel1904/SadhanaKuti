const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Registration = require('../models/Registration');
const Exam = require('../models/Exam');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// Setup multer for payment screenshot
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/payments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Student: register for exam (single or bulk)
router.post('/', authMiddleware, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    let { examId, examIds, mode } = req.body;
    let ids = [];
    if (examIds) {
      try { ids = JSON.parse(examIds); } catch (e) { ids = [examIds]; }
    } else if (examId) {
      ids = [examId];
    }
    
    if (!Array.isArray(ids)) ids = [ids];
    if (!ids.length) return res.status(400).json({ message: 'Exam ID(s) required' });

    mode = mode === 'online' ? 'online' : 'offline';
    const paymentScreenshotUrl = req.file ? `/uploads/payments/${req.file.filename}` : '';
    const registrations = [];

    for (const eid of ids) {
      const exam = await Exam.findById(eid);
      if (!exam) continue;

      // Check stream eligibility
      if (req.user.stream !== 'BOTH' && exam.stream !== 'BOTH' && exam.stream !== req.user.stream) continue;

      // Check if already registered
      const existing = await Registration.findOne({ student: req.user._id, exam: eid });
      if (existing) continue;

      const reg = await Registration.create({
        student: req.user._id,
        exam: eid,
        mode,
        paymentScreenshotUrl,
        status: 'pending',
      });
      registrations.push(reg);
    }

    if (registrations.length === 0) {
      return res.status(400).json({ message: 'No valid new registrations could be created. Check eligibility or previous registrations.' });
    }

    res.status(201).json({ message: 'Registration submitted', count: registrations.length, registrations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: get my registrations
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user._id })
      .populate('exam')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all registrations
router.get('/admin', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const registrations = await Registration.find(filter)
      .populate('student', 'name email phone batch stream')
      .populate('exam', 'title date time')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: verify registration (confirm / reject)
router.put('/:id/verify', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const registration = await Registration.findById(req.params.id).populate('student exam');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    // Auto-generate roll number on confirm
    if (status === 'confirmed' && !registration.rollNumber) {
      const count = await Registration.countDocuments({ status: 'confirmed' });
      registration.rollNumber = `MHT-2026-${String(count + 1).padStart(4, '0')}`;
    }

    registration.status = status;
    if (adminNote) registration.adminNote = adminNote;
    await registration.save();

    // Send Email Notification (Async, don't block response)
    const { sendConfirmationEmail, sendRejectionEmail } = require('../utils/emailService');
    const student = registration.student;
    const exam = registration.exam;

    if (status === 'confirmed') {
      sendConfirmationEmail(student.email, student.name, exam.title, registration.rollNumber, registration.mode)
        .catch(err => console.error('Error sending confirmation email:', err));
    } else if (status === 'rejected') {
      sendRejectionEmail(student.email, student.name, exam.title, adminNote)
        .catch(err => console.error('Error sending rejection email:', err));
    }

    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get admit card data (student or admin)
router.get('/:id/admit-card-data', authMiddleware, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('student', 'name email phone batch stream')
      .populate('exam');

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    // Only the student who owns it or admin
    if (req.user.role !== 'admin' && registration.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (registration.status !== 'confirmed') {
      return res.status(400).json({ message: 'Admit card not yet available' });
    }

    res.json({
      studentName: registration.student.name,
      email: registration.student.email,
      phone: registration.student.phone,
      batch: registration.student.batch,
      stream: registration.student.stream,
      rollNumber: registration.rollNumber,
      examTitle: registration.exam.title,
      examDate: registration.exam.date,
      examTime: registration.exam.time,
      centerName: registration.exam.centerName,
      centerAddress: registration.exam.centerAddress,
      syllabus: registration.exam.syllabus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
