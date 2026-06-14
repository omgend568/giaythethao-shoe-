const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CartItem = sequelize.define(
    'CartItem',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cartId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'carts', key: 'id' },
        },
        productVariantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'product_variants', key: 'id' },
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        price: {
            type: DataTypes.DECIMAL(10,2),
            defaultValue: 0.0,
        }
    },
    {
        tableName: 'cart_items',
        timestamps: false,
    }
);

module.exports = CartItem;
