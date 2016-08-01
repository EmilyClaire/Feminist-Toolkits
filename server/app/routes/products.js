'use strict';

var router = require('express').Router();
var Product = require('../../db/models/product');
var Review = require('../../db/models/review');
var Category = require('../../db/models/category');
var ensureAdmin = require('./utils').ensureAdmin;
var Promise = require('sequelize').Promise;

router.get('/', function (req, res, next) {
    Product.findAll()
    .then(function (products) {
        res.json(products);
    })
    .catch(next);
});

router.get('/:id', function (req, res, next) {
    Promise.all([
        Product.findById(req.params.id),
        Category.findAll({
            include: [{
                model: Product,
                required: true,
                through: {
                    where: {
                        productId: req.params.id
                    }
                }

            }]
        })
    ])
    .then(function (arrayOfResolves) {
        var product = arrayOfResolves[0];
        var categories = arrayOfResolves[1];
        if (product) {
            var productObj = {
                product: product,
                categories: categories
            }
            res.json(productObj);
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
