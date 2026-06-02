const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'giay_database',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected successfully');
        await sequelize.sync({ alter: false, force: false });
        console.log('Database models synchronized');
    } catch (error) {
        console.error('Unable to connect to MySQL:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
