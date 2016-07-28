//This is the category model.

'use strict';
var Sequelize = require('sequelize');
var Product = require('./product');
var db = require('../_db');

var Category = db.define('category', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
});



module.exports = Category;
