const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./db'); // Đường dẫn tới tệp db.js

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
const authRouter = require('./routes/auth'); // Đường dẫn tới tệp chứa các route
app.use('/api/auth', authRouter);

async function startServer() {
    try {
        await connectDB(); // Kết nối MongoDB
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`Server đang chạy tại http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Lỗi khi khởi động server:', error);
    }
}

startServer();
