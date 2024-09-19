const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri); // Không cần các tùy chọn useNewUrlParser và useUnifiedTopology

async function connectDB() {
    try {
        await client.connect();
        console.log('Kết nối MongoDB thành công!');
        return client.db(); // Trả về đối tượng DB để truy cập các collection
    } catch (error) {
        console.error('Lỗi kết nối MongoDB:', error);
    }
}

module.exports = connectDB;
