'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');
var Product=require('./product');

module.exports = db.define('order', {
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        status: {
            type: Sequelize.STRING,
            defaultValue: 'Not shipped'
        },
        shippingAddress: {
            type: Sequelize.STRING,
            allowNull: false
        }
    },{defaultScope: {include: { model: Product}}});