const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 5001;

app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use('/api', authRoutes);

connectDB();

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
