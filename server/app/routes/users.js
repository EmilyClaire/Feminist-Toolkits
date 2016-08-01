'use strict';
var router = require('express').Router();
var User = require('../../db/models/user');
var utils = require('./utils')

router.get('/', utils.ensureAdmin, function (req, res, next) {
  User.findAll()
  .then(function (userArr) {
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
    res.sendStatus(401);
  }
});

router.post('/', function (req, res, next) {
  User.findOne({where: {email: req.body.email}})
  .then(function (user) {
    if (user) {
      res.status(409).send("There is already an account with this email");
      return;
    }
    else
      User.create(req.body)
      .then(function(user){
        res.status(201).send(user);
      })
  })
});

router.put('/:userId', function (req, res, next) {
  if (req.user.id===req.params.userId || req.user.isAdmin) {
    User.findById(req.params.userId)
    .then(function(userInstance){
      return userInstance.update(req.body)
    })
    .then(function (userUpdated) {
      res.status(201).send(userUpdated)
    })
    .catch(next);
  }
  else(function () {
    res.sendStatus(401)
  });
});

module.exports= router;
