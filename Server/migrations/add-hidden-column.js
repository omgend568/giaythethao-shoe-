const { sequelize } = require('../config/db');

async function run() {
    try {
        await sequelize.query(`
            ALTER TABLE reviews 
            ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE,
            ADD COLUMN hidden_at DATETIME
        `);
        console.log('Thêm cột thành công!');
        process.exit(0);
    } catch (e) {
        if (e.message.includes('Duplicate')) {
            console.log('Cột đã tồn tại, bỏ qua!');
        } else {
            console.error('Lỗi:', e.message);
        }
        process.exit(0);
    }
}

run();
