require('dotenv').config();

const express = require('express');
const app = express();
const route = require('./routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectDB } = require('./config/db');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const { askQuestion } = require('./utils/chatbot');

require('./models/associations');

const port = process.env.PORT || 5001;
const clientUrl = process.env.CLIENT_URL || process.env.REACT_APP_URL || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: clientUrl,
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true,
    },
});

app.use(cookieParser());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

route(app);
connectDB();

app.post('/chat', async (req, res) => {
    const { question } = req.body;
    const data = await askQuestion(question);
    return res.status(200).json(data);
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = { app, io, isProduction };
