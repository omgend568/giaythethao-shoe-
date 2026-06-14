const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PromotionUsage = sequelize.define(
    'PromotionUsage',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        promotionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'promotions', key: 'id' },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'orders', key: 'id' },
        },
        discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        usedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'promotion_usages',
        timestamps: false,
    }
);

module.exports = PromotionUsage;
