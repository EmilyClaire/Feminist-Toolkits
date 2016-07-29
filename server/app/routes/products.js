'use strict';
var router = require('express').Router();
var bodyParser = require('body-parser');
var Product = require('../../db/models/product');
var Review = require('../../db/models/review');
var ensureAdmin = require('./utils').ensureAdmin;

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

router.post('/', ensureAdmin, function (req, res, next) {
    Product.create(req.body)
    .then(newProduct => res.json(newProduct))
    .catch(next);
});

router.put('/:id', ensureAdmin, function (req, res, next) {
    Product.findOne({
        where: {
            id: req.params.id
        }
    })
    .then(function (product) {
        return product.update(req.body);
    })
    .then(function (updatedProduct) {
        var responseObj = {
          message: 'Updated successfully',
          article: updatedProduct
        };
        res.json(responseObj);
    })
    .catch(next);
});

router.get('/:productId/reviews', function (req, res, next) {
    Review.findAll({
        where: {
            productId: req.params.productId
        }
    })
    .then(function (reviews) {
        res.json(reviews);
    })
    .catch(next);
});

module.exports = router;
