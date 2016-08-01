'use strict';

app.factory('OrderFactory', function ($http) {

  var OrderFactory = {};

  function getData (response) {
    return response.data;
  }

  OrderFactory.fetchAll = function () {
    return $http.get('/api/orders')
    .then(getData);
  };

  OrderFactory.placeOrder = function (order) {
    return $http.post('/api/orders',order)
    .then(getData);
  };

  return OrderFactory;

});
