'use strict';
var router = require('express').Router();

var _ = require('lodash');
var Product = require('../../db/models/product');
var Categories = require('../../db/models/product');
var Reviews = require('../../db/models/review');

router.get('/', function (req, res, next) {
    Product.findAll()
    .then(function (products) {
        res.json(products);
    })
    .catch(next);
});

router.get('/:id', function (req, res, next) {
    Product.findById(req.params.id)
    .then(function (product) {
      if (product) {
        res.json(product);
      } else {
        res.status(404).send();
      }
    })
    .catch(next);
})

// findAll,
// find(by Category - query or param)
// find(by Name - includes, not exact match - query or param)
// findbyId

// get all reviews for product

// Create/post
// Edit/Put
// Delete

module.exports = router;
