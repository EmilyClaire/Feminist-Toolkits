'use strict';

app.factory('ProductsFactory', function ($http) {

  var ProductsFactory = {};

  function getData (response) {
    return response.data;
  }

  ProductsFactory.fetchAll = function (categoryId) {

    var queryParams = {};

    if (categoryId) {
      queryParams.category = categoryId;
    }

    return $http.get('/api/products', {
      params: queryParams
    })
    .then(getData);
  };

  ProductsFactory.fetchById = function (id) {
    return $http.get('/api/products/' + id)
    .then(getData);
  };

  ProductsFactory.create = function (data) {
      return $http.post('/products', data)
      .then(getData)
      .then(function (newProduct) {
        var product = newProduct;
        return product;
      });
  };

  return ProductsFactory;

});
