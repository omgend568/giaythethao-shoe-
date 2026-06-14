const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductVariant = sequelize.define(
    'ProductVariant',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'products', key: 'id' },
        },
        color: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        size: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: false,
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        sku: {
            type: DataTypes.STRING(100),
        },
    },
    {
        tableName: 'product_variants',
        timestamps: true,
    }
);

module.exports = ProductVariant;
