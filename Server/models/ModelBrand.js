const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Brand = sequelize.define(
    'Brand',
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
        tableName: 'brand',
        timestamps: true,
    }
);

module.exports = Brand;

