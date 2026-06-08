const { DataTypes } = require('sequelize');
const { sequelize } = require('../Config/db');

const Payment = sequelize.define(
    'Payment',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'orders', key: 'id' },
        },
        method: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: false,
        },
        // 0: pending, 1: paid, 2: failed
        status: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
        },
        paidAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'payments',
        timestamps: false,
    }
);

module.exports = Payment;
