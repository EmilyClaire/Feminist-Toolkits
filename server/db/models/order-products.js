'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');

module.exports = db.define('order_products', {
    priceAtPurchase: Sequelize.FLOAT(10,2),
    quantity: Sequelize.INTEGER
});