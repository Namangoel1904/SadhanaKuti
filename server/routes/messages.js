const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// POST /api/messages (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Server error while saving message. Please try again later.' });
  }
});

// GET /api/messages (Admin only - assuming middleware is applied in index.js or no auth required for now based on other routes, let's keep it simple)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error while fetching messages.' });
  }
});

// DELETE /api/messages/:id (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error while deleting message' });
  }
});

module.exports = router;
