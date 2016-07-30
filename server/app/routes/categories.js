//category routes
var router = require('express').Router();
var Category = require('../../db/models/category');
var auth = require('./utils');

router.get('/', function(req, res, next){
  Category.findAll()
  .then(function(categories){
    res.status(200).send(categories);
  })
  .catch(next);
});

router.post('/', auth.ensureAdmin, function(req, res, next){
  Category.create(req.body)
  .then(function(result){
    res.status(201).send(result);
  })
  .catch(next);
});

router.delete('/:id', auth.ensureAdmin, function(req, res, next){
  Category.destroy({
    where: {
      id: req.params.id
    }
  })
  .then(function(result){
    res.sendStatus(204);
  })
  .catch(next);
});

router.put('/:id', auth.ensureAdmin, function(req, res, next){
  Category.update(req.body, {
    where: {
      id: req.params.id
    }
  })
  .then(function(){
    res.sendStatus(201)
  })
  .catch(next);
});
module.exports= router;
