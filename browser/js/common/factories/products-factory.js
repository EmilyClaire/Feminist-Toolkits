'use strict';

app.factory('ProductsFactory', function ($http) {

  var ProductsFactory = {};

  function getData (response) {
    return response.data;
  }

  ProductsFactory.fetchAll = function () {

    // var queryParams = {};

    // if (categoryId) {
    //   queryParams.categoryId = categoryId;
    // }

    // return $http.get('/api/products', {
    //   params: queryParams
    // })
    return $http.get('/api/products')
    .then(getData);
  };

  ProductsFactory.fetchById = function (id) {
    return $http.get('/api/products/' + id)
    .then(getData);
  };

  ProductsFactory.create = function (data) {
      console.log('creating',data);
      return $http.post('/api/products', data)
      .then(getData)
      .then(function (newProduct) {
        return newProduct;
      });
  };

  ProductsFactory.update = function (id,data) {
      return $http.put('/api/products/'+id, data)
      .then(getData)
      .then(function (newProduct) {
        return newProduct;
      });
  };

  return ProductsFactory;

});
