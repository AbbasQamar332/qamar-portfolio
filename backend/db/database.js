const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'portfolio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Insert default admin if not exists
        db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
            if (!row) {
                const saltRounds = 10;
                bcrypt.hash('password123', saltRounds, (err, hash) => {
                    if (!err) {
                        db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
                    }
                });
            }
        });

        // Projects Table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            image_url TEXT,
            link TEXT
        )`);

        // Skills Table
        db.run(`CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            icon TEXT
        )`);

        // About Table (Single row)
        db.run(`CREATE TABLE IF NOT EXISTS about (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT
        )`, (err) => {
            if (!err) {
                db.get('SELECT * FROM about', (err, row) => {
                    if (!row) {
                        db.run('INSERT INTO about (content) VALUES (?)', ['Qamar Abbas is a BBA graduate...']);
                    }
                });
            }
        });

        // Messages Table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

module.exports = db;
