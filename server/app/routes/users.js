'use strict';
var router = require('express').Router();

var User = require('../../db/models/user');
var utils = require('./utils')

router.get('/', utils.ensureAdmin, function (req, res, next) {
  User.findAll()
  .then(function (userArr) {
    console.log('here be users:', userArr || 'nope')
    res.send(userArr)
  })
  .catch(next);
});

router.get('/:userId', function (req, res, next) {
  if (req.user.id===req.params.userId || req.user.isAdmin){
    User.findOne({where: {id: req.params.userId}})
    .then(function(user){
      res.send(user);
    })
    .catch(next);
  }
  else{
    res.send(401);
  }
});

router.post('/', function (req, res, next) {
  User.findOrCreate({where: {email: req.body.email}})
  .then(function (userCreated) {
    if (!userCreated[1]) {
      res.status(409).send("There is already an account with this email");
    }
    else {
      res.status(201).send(userCreated[0]);
    }
  })
  .catch(next);
});

// router.put('/', function (req, res, next) {

// });

module.exports= router;
