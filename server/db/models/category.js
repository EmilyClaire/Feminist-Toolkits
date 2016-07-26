'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');

//testing
module.exports = db.define('category', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
});
