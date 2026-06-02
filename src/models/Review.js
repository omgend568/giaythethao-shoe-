const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Review = sequelize.define(
    'Review',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
        },
        orderItemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'order_items',
                key: 'id',
            },
        },
        rating: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 5,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'reviews',
        timestamps: true,
    }
);

module.exports = Review;
