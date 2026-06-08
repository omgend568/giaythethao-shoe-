const { Sequelize, DataTypes } = require('sequelize');
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
        await sequelize.authenticate();
        console.log('MySQL kết nối thành công');

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
