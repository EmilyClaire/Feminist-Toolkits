'use strict';
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
    }
});
