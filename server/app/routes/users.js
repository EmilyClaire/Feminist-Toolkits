'use strict';
var router = require('express').Router();

var User = require('../../db/models/user');
var utils = require('./utils')

router.get('/', utils.ensureAdmin, function (req, res, next) {
  User.findAll()
  .then(function (userArr) {
    res.json(userArr)
  })
  .catch(next);
});

router.get('/:userId', function (req, res, next) {
  if (req.user.id===req.params.userId || req.user.isAdmin){
    User.findOne({where: {id: req.params.userId}})
    .then(function(user){
      res.json(user);
    })
    .catch(next);
  }
  else{
    res.send(401);
  }
});

// router.get('/', function (req, res, next) {

// });


module.exports= router;
