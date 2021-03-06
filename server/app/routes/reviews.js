'use strict';
var router = require('express').Router();
module.exports = router;
var db = require('../../db');
var Review = db.model('review');
var utils = require('./utils');

// var _ = require('lodash');

//insert as second arg of router.get before cb, if needed:
// ensureAuthenticated()

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
  Review.create(req.body)
  .then(function(createdReview){
    res.status(201).json(createdReview);
  })
  .catch(function(err) { next(err); })
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
