const { DataTypes } = require('sequelize');
const { sequelize } = require('../Config/db');

const ProductCategory = sequelize.define(
    'ProductCategory',
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
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'categories', key: 'id' },
        },
    },
    {
        tableName: 'product_categories',
        timestamps: false,
    }
);

module.exports = ProductCategory;
