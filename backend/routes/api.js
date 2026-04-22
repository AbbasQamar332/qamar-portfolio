const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Configure Multer for image upload
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// --- Auth Routes ---
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 }); // 24 hours
                res.status(200).json({ auth: true, token: token });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        });
    });
});

// --- Public Routes ---
router.get('/projects', (req, res) => {
    db.all('SELECT * FROM projects', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/skills', (req, res) => {
    db.all('SELECT * FROM skills', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/about', (req, res) => {
    db.get('SELECT * FROM about LIMIT 1', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

router.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    db.run('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)', [name, email, message], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Message sent successfully' });
    });
});


// --- Protected Admin Routes ---
router.post('/projects', verifyToken, (req, res) => {
    const { title, description, image_url, link } = req.body;
    db.run('INSERT INTO projects (title, description, image_url, link) VALUES (?, ?, ?, ?)', 
        [title, description, image_url, link], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Project added successfully' });
    });
});

router.put('/projects/:id', verifyToken, (req, res) => {
    const { title, description, image_url, link } = req.body;
    db.run('UPDATE projects SET title = ?, description = ?, image_url = ?, link = ? WHERE id = ?', 
        [title, description, image_url, link, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Project updated successfully' });
    });
});

router.delete('/projects/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM projects WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Project deleted successfully' });
    });
});

// Skills CRUD
router.post('/skills', verifyToken, (req, res) => {
    const { title, description, icon } = req.body;
    db.run('INSERT INTO skills (title, description, icon) VALUES (?, ?, ?)', 
        [title, description, icon], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Skill added successfully' });
    });
});

router.delete('/skills/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM skills WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Skill deleted successfully' });
    });
});

// About update
router.put('/about', verifyToken, (req, res) => {
    const { content } = req.body;
    db.run('UPDATE about SET content = ?', [content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'About section updated successfully' });
    });
});

// Messages view & delete
router.get('/messages', verifyToken, (req, res) => {
    db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.delete('/messages/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM messages WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Message deleted successfully' });
    });
});

// Image Upload
router.post('/upload', verifyToken, upload.single('image'), (req, res) => {
    if (req.file == undefined) {
        return res.status(400).json({ error: 'No file selected!' });
    } else {
        res.json({
            message: 'File Uploaded!',
            fileUrl: `/uploads/${req.file.filename}`
        });
    }
});

module.exports = router;
