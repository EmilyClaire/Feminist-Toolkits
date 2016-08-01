'use strict';

app.factory('CategoryFactory', function ($http) {

  var CategoryFactory = {};

  function getData (response) {
    return response.data;
  }

  CategoryFactory.fetchAll = function () {
    return $http.get('/api/categories')
    .then(getData);
  };

  return CategoryFactory;

});
