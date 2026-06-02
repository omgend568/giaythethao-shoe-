const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define(
    'Category',
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
        brandId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'brand', key: 'id' },
        },
    },
    {
        tableName: 'categories',
        timestamps: false,
    }
);

module.exports = Category;
