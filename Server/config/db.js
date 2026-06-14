const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbName = process.env.DB_NAME || 'shoe_database';

const sequelize = new Sequelize(
    dbName,
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
    }
);

async function ensureDatabase() {
    const temp = new Sequelize('', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
    });

    await temp.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await temp.close();
}

async function ensureGoogleLoginColumns() {
    const queryInterface = sequelize.getQueryInterface();
    let table;

    try {
        table = await queryInterface.describeTable('users');
    } catch {
        return;
    }

    if (!table.googleId) {
        await queryInterface.addColumn('users', 'googleId', {
            type: DataTypes.STRING(255),
            allowNull: true,
        });
        console.log('Đã thêm cột users.googleId');
    }
}

const connectDB = async () => {
    try {
        await ensureDatabase();
        await sequelize.authenticate();
        console.log(`MySQL kết nối thành công → database: ${dbName}`);

        const syncAlter = process.env.DB_SYNC_ALTER === 'true';
        await sequelize.sync({ alter: syncAlter, force: false });
        await ensureGoogleLoginColumns();
        const { seedBrandsData } = require('../controllers/ControllerCategory');
        await seedBrandsData();
        

        console.log('Tất cả các mô hình đã được đồng bộ hóa với cơ sở dữ liệu');
    } catch (error) {
        console.error('Không thể kết nối đến MySQL:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
