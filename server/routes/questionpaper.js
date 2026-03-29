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
function parseQuestionsFromHtmlStr(htmlString) {
  // Convert HTML to text while preserving [IMG:url] markers
  const rawText = htmlString
    .replace(/<\/p>|<br\s*\/?>/gi, '\n')
    .replace(/<img[^>]+src="([^">]+)"[^>]*>/gi, '\n[IMG:$1]\n')
    .replace(/<[^>]+>/g, '') // Strip remaining tags
    .replace(/&nbsp;/g, ' ');

  const questions = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentQ = null;

  for (let line of lines) {
    if (/^Q?\d+[\.\)]\s*/i.test(line)) {
      if (currentQ && currentQ.options.A.text && currentQ.options.B.text && currentQ.options.C.text && currentQ.options.D.text) {
        questions.push(currentQ);
      }
      currentQ = {
        questionText: line.replace(/^Q?\d+[\.\)]\s*/i, '').trim(),
        options: { A: { text: '' }, B: { text: '' }, C: { text: '' }, D: { text: '' } },
        _correct: null
      };
      continue;
    }

    if (!currentQ) continue;

    const isCorrect = line.startsWith('*') || line.startsWith('∗'); // handle different star characters
    if (isCorrect) line = line.substring(1).trim();

    const match = line.match(/^([ABCD])[\.\)]\s*(.*)/i);
    if (match) {
      const optionKey = match[1].toUpperCase();
      currentQ.options[optionKey].text = match[2].trim();
      if (isCorrect) currentQ._correct = optionKey;
    } else {
      // If no option has been parsed yet, it's a multiline question
      if (!currentQ.options.A.text && !currentQ.options.B.text) {
        currentQ.questionText += '\n' + line;
      } else {
        // Append to the last parsed option
        const opts = ['A', 'B', 'C', 'D'];
        for (let i = opts.length - 1; i >= 0; i--) {
          const opt = opts[i];
          if (currentQ.options[opt].text || currentQ.options[opt].text === '') { // if we are currently parsing this option
              currentQ.options[opt].text += '\n' + line;
              break;
          }
        }
      }
    }
  }

  if (currentQ && currentQ.options.A.text && currentQ.options.B.text && currentQ.options.C.text && currentQ.options.D.text) {
    questions.push(currentQ);
  }

  // Extract images from text
  const extractImg = (str) => {
    const imgMatch = str.match(/\[IMG:([^\]]+)\]/);
    return {
      text: str.replace(/\[IMG:[^\]]+\]/g, '').trim(),
      imageUrl: imgMatch ? imgMatch[1] : ''
    };
  };

  return questions.map(q => {
    const qData = extractImg(q.questionText);
    return {
      questionText: qData.text,
      questionImageUrl: qData.imageUrl,
      options: {
        A: extractImg(q.options.A.text),
        B: extractImg(q.options.B.text),
        C: extractImg(q.options.C.text),
        D: extractImg(q.options.D.text),
      },
      _correct: q._correct
    };
  });
}

// Upload question paper Word doc
router.post('/upload', authMiddleware, requireAdmin, upload.single('doc'), async (req, res) => {
  try {
    const { examId, section } = req.body;
    if (!examId || !section || !req.file) {
      return res.status(400).json({ message: 'examId, section and doc file required' });
    }

    const options = {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          const ext = image.contentType === "image/png" ? "png" : "jpeg";
          const filename = `img_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
          const dir = path.join(__dirname, '../uploads/questions');
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, filename), imageBuffer, 'base64');
          return { src: `/uploads/questions/${filename}` };
        });
      })
    };

    const result = await mammoth.convertToHtml({ path: req.file.path }, options);
    const parsedQuestions = parseQuestionsFromHtmlStr(result.value);

    if (parsedQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions parsed. Check document format.' });
    }

    // Extract answer key along the way
    const answers = parsedQuestions.map(q => q._correct || '');
    const cleanQuestions = parsedQuestions.map(({ questionText, questionImageUrl, options }) => ({ questionText, questionImageUrl, options }));

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

    const options = {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          const ext = image.contentType === "image/png" ? "png" : "jpeg";
          const filename = `img_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
          const dir = path.join(__dirname, '../uploads/questions');
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, filename), imageBuffer, 'base64');
          return { src: `/uploads/questions/${filename}` };
        });
      })
    };

    const result = await mammoth.convertToHtml({ path: req.file.path }, options);
    const parsedQuestions = parseQuestionsFromHtmlStr(result.value);
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
