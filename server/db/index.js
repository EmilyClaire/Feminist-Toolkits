'use strict';
var db = require('./_db');
module.exports = db;

var User = require('./models/user');
var Order = require('./models/order');
var Review = require('./models/review');
var Product = require('./models/product');
var Category = require('./models/category');
