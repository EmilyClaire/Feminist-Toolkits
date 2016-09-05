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
  .then(function(){
    res.sendStatus(204);
  })
  .catch(next);
});

router.put('/:id', auth.ensureAdmin, function(req, res, next){
  Category.update(req.body, {
    where: {
      id: req.params.id
    },
    returning: true
  })
  .then(function(resultArr){

    if(resultArr[0] !== 1){
      var err = new Error();
      err.message = "Nothing updated";
      next(err);
    }
    var result = resultArr[1][0];
    res.status(200).send(result);
  })
  .catch(next);
});
module.exports= router;
