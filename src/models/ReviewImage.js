const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReviewImage = sequelize.define(
    'ReviewImage',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        reviewId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'reviews',
                key: 'id',
            },
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'review_images',
        timestamps: false,
    }
);

module.exports = ReviewImage;
