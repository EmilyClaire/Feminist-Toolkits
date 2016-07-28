'use strict';

app.factory('ProductsFactory', function ($http) {

  var ProductsFactory = {};

  function getData (response) {
    return response.data;
  }

  ProductsFactory.fetchAll = function () {
    return $http.get('/api/products')
    .then(getData);
  };

  ProductsFactory.fetchById = function (id) {
    return $http.get('/api/products/' + id)
    .then(getData);
  };

  return ProductsFactory;

});
