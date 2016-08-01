'use strict';
var router = require('express').Router();
module.exports = router;
var db = require('../../db');
var Review = db.model('review');
var utils = require('./utils');

router.get('/product/:prodId', function (req, res, next) {
  Review.findAll({where: {productId: req.params.prodId}})
  .then(function(reviewArr){
    res.json(reviewArr);
  })
  .catch(function(err) { next(err); })
});

router.get('/user/:userId', function (req, res, next) {
  Review.findAll({where: {userId: req.params.userId}})
  .then(function(reviewArr){
    res.json(reviewArr);
  })
  .catch(function(err) { next(err); })
});

router.post('/', utils.ensureAuthenticated, function (req, res, next) {
  var productId = req.body.productId;
  var userId = req.body.userId;
  var review;

  Review.create(req.body)
  .then(function(createdReview){
      review = createdReview;
    return review.setUser(userId);
  }).then(function(resultObj){
    if(resultObj){
      return review.setProduct(productId)
    }
    else{
        var err = new Error();
        err.message = "OMG, SOMETHING HAS GONE WRONG. check reviews.js in routes line 38"
        next(err);
    }
  })
  .then(function(obj){
        if(obj){
        res.status(201).json(review);
      }
      else{
        var err = new Error();
        err.message = "OMG, SOMETHING HAS GONE WRONG. check reviews.js in routes line 43"
        next(err);
      }
    })
  .catch(next)
});

router.delete('/:id', utils.ensureAuthenticated, function (req, res, next) {
  var whereClause;
  if (req.user.isAdmin) {
    whereClause = {where: {id: req.params.id}}}
  else {
    whereClause = {where: {id: req.params.id, userId: req.user.id}}}
  Review.destroy(whereClause)
  .then(function(response){
    if(+response >= 1)
    {res.sendStatus(204)}
    else {res.sendStatus(401)}
  })
  .catch(function(err) { next(err); })
});
