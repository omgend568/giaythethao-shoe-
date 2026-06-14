const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define(
    'Product',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        brandId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'brand',
                key: 'id',
            },
        },
        rating_avg: {
            type: DataTypes.DECIMAL(2, 1),
            defaultValue: 0.0,
        },
        rating_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    },
    {
        tableName: 'products',
        timestamps: true,
    }
);

module.exports = Product;
