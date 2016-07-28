'use strict';
var _ = require('lodash');
var Sequelize = require('sequelize');

var db = require('../_db');

//testing
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
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    photoUrl: {
        type: Sequelize.STRING,
        defaultValue: '/Users/Mac/GraceHopper/Feminist-Toolkits/public/images/default.png'
    }
});
