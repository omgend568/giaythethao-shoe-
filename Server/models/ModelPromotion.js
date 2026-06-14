const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Promotion = sequelize.define(
    'Promotion',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // percent: giảm theo %, fixed: giảm số tiền cố định
        discount_type: {
            type: DataTypes.ENUM('percent', 'fixed'),
            allowNull: false,
            defaultValue: 'percent',
        },
        discount_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        min_order_amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
        },
        max_discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        usage_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        usage_per_user: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
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
        tableName: 'promotions',
        timestamps: true,
    }
);

module.exports = Promotion;
