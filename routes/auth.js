const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const connectDB = require('../db'); // Đường dẫn tới tệp db.js
const router = express.Router();
require('dotenv').config();
// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// Đăng ký người dùng
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const newUser = {
            name,
            email,
            password: hashedPassword,
            emailToken,
            isVerified: false
        };

        await usersCollection.insertOne(newUser);

        const url = `${process.env.VERIFY_EMAIL_URL}?token=${emailToken}`;

        // Gửi email xác thực
        await transporter.sendMail({
            to: email,
            subject: 'Xác thực Email',
            html: `<h2>Chào ${name},</h2><p>Vui lòng nhấp vào liên kết sau để xác thực tài khoản của bạn:</p><a href="${url}">Xác thực Email</a>`,
        });

        res.status(201).json({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.' });
    } catch (error) {
        console.error('Lỗi trong quá trình đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server.', error: error.message });
    }
});

// Xác thực email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await usersCollection.findOne({ email: decoded.email });
        if (!user) {
            return res.status(400).json({ message: 'Người dùng không tồn tại.' });
        }

        await usersCollection.updateOne(
            { email: decoded.email },
            { $set: { isVerified: true, emailToken: null } }
        );

        res.status(200).json({ message: 'Xác thực email thành công.' });
    } catch (error) {
        res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Người dùng không tồn tại.' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Tài khoản chưa được xác thực.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Sai mật khẩu.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, message: 'Đăng nhập thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

module.exports = router;
