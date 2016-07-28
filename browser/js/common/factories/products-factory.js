'use strict';

app.factory('ProductsFactory', function ($http) {

  var ProductsFactory = {};

  ProductsFactory.fetchAll = function () {
    return $http.get('/api/products')
    .then(function (response) { return response.data; });
  };

  ProductsFactory.fetchById = function (id) {
    return $http.get('/api/products/' + id)
    .then(function (response) { return response.data; });
  };

  return ProductsFactory;

});
