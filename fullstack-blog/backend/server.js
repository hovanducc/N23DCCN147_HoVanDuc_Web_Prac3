const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // Sử dụng promises để dùng async/await
const path = require('path');
const app = express();

const DATA_PATH = path.join(__dirname, 'data.json');
const COMMENTS_DATA_PATH = path.join(__dirname, 'comments.json');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

async function readData() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Nếu file data.json chưa tồn tại hoặc bị lỗi, tạo mới với 2 bài viết mẫu
        const defaultPosts = [
            { id: 1, title: 'Bài viết đầu tiên', content: 'Nội dung bài 1', author: 'Admin' },
            { id: 2, title: 'Hướng dẫn NextJS', content: 'Nội dung bài 2', author: 'Admin' },
        ];
        await writeData(defaultPosts);
        return defaultPosts;
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

async function readCommentsData() {
    try {
        const data = await fs.readFile(COMMENTS_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        const defaultComments = [
            { id: 1, postId: 1, author: 'Học viên', content: 'Bài viết rất hay!' }
        ];
        await writeCommentsData(defaultComments);
        return defaultComments;
    }
}

async function writeCommentsData(data) {
    await fs.writeFile(COMMENTS_DATA_PATH, JSON.stringify(data, null, 2));
}

app.get('/api/posts', async (req, res) => {
    const posts = await readData();
    res.json(posts);
});

app.post('/api/posts', async (req, res) => {
    const posts = await readData();
    const newPost = { id: Date.now(), ...req.body };
    posts.push(newPost);
    await writeData(posts);
    res.status(201).json(newPost);
});

app.delete('/api/posts/:id', async (req, res) => {
    let posts = await readData();
    posts = posts.filter(p => p.id !== Number(req.params.id));
    await writeData(posts);
    res.json({ message: 'Đã xóa' });
});

app.put('/api/posts/:id', async (req, res) => {
    const posts = await readData();
    const index = posts.findIndex(p => p.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Không tìm thấy' });
    
    posts[index] = { ...posts[index], ...req.body };
    await writeData(posts);
    res.json(posts[index]);
});

app.get('/api/posts/:id/comments', async (req, res) => {
    const comments = await readCommentsData();
    const postId = Number(req.params.id);
    const postComments = comments.filter(c => c.postId === postId);
    res.json(postComments);
});

app.post('/api/posts/:id/comments', async (req, res) => {
    const comments = await readCommentsData();
    const postId = Number(req.params.id);
    const { author, content } = req.body;
    const newComment = { id: Date.now(), postId, author, content };
    comments.push(newComment);
    await writeCommentsData(comments);
    res.status(201).json(newComment);
});

app.delete('/api/comments/:commentId', async (req, res) => {
    let comments = await readCommentsData();
    const commentId = Number(req.params.commentId);
    comments = comments.filter(c => c.id !== commentId);
    await writeCommentsData(comments);
    res.json({ message: 'Đã xóa bình luận' });
});

app.listen(5000, () => console.log('Backend chạy tại port: 5000'));