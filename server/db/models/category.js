'use strict';
var Sequelize = require('sequelize');
var db = require('../_db');

var Category = db.define('category', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
      }
    }
});

module.exports = Category;
