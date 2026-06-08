const { DataTypes } = require('sequelize');
const { sequelize } = require('../Config/db');

const Cart = sequelize.define(
    'Cart',
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
        address: {
            type: DataTypes.STRING(500), // Độ dài 500 để khách nhập địa chỉ dài thoải mái
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
        tableName: 'carts',
        timestamps: true,
    }
);

module.exports = Cart;
