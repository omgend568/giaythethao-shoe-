const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define(
    'Order',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        promotionId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'promotions', key: 'id' },
        },
        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
        },
        total_price: {
            type: DataTypes.DECIMAL(10,2),
            defaultValue: 0.0,
        },
        status: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'orders',
        timestamps: true,
    }
);

module.exports = Order;
