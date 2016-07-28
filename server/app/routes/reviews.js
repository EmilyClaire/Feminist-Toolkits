'use strict';
var router = require('express').Router();
module.exports = router;
var db = require('../../db');
var Review = db.model('review');

// var _ = require('lodash');

//insert as second arg of router.get before cb, if needed:
// var ensureAuthenticated = function (req, res, next) {
//     if (req.isAuthenticated()) {
//         next();
//     } else {
//         res.status(401).end();
//     }
// };

router.get('/', function (req, res, next) {
  Review.findAll()
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

router.post('/', function (req, res, next) {
  //add user authentication!!
  Review.create(req.body)
  .then(function(createdReview){
    res.status(201).json(createdReview);
  })
  .catch(function(err) { next(err); })
});

router.delete('/:id', function (req, res, next) {
  //add user authentication!!
  Review.destroy({where: {id: req.params.id}})
  .then(function(response){
    console.log("##DELETE##", response);
    res.status(200).json(response);
  })
  .catch(function(err) { next(err); })
});
