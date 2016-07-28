'use strict';
var router = require('express').Router();

var Product = require('../../db/models/product');
var Review = require('../../db/models/review');

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
        var err = new Error('Product not found');
        err.status = 404;
        next(err);
      }
    })
    .catch(next);
});

router.get('/:id/reviews', function (req, res, next) {
    Review.findAll({
        where: {
            productId: req.params.id
        }
    })
    .then(function (reviews) {
        res.json(reviews);
    })
    .catch(next);
})

module.exports = router;
