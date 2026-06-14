const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PromotionProduct = sequelize.define(
    'PromotionProduct',
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
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'products', key: 'id' },
        },
    },
    {
        tableName: 'promotion_products',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['promotionId', 'productId'],
            },
        ],
    }
);

module.exports = PromotionProduct;
