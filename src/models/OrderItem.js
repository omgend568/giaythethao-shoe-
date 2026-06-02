const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define(
    'OrderItem',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'orders', key: 'id' },
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
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.0,
        },
    },
    {
        tableName: 'order_items',
        timestamps: false,
    }
);

module.exports = OrderItem;
