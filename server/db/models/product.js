'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');
var Category = require('./category');

module.exports = db.define('product', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    inventory: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    currentPrice: {
        type: Sequelize.FLOAT(10,2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    photoUrl: {
        type: Sequelize.STRING,
        defaultValue: '/images/default.png'
    }
}, {
    defaultScope: {
        include: [{
            model: Category
        }]
    }
});
