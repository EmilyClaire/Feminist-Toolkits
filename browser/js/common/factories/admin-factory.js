'use strict'

app.factory('AdminFactory',function ($http) {
  var adminFac = {};

  adminFac.makeAdmin = function(user){
    return $http.put('/api/users/'+user.id,{isAdmin: true})
    .then(function (putResponse) {
      return (putResponse.data);
    })
    .catch(function (err) {
      console.log(err);
    })
  }

  adminFac.addCat = function (catName) {
    return $http.post('/api/categories/', {name: catName})
    .then(function (newCat) {
      return (newCat);
    })
    .catch(function (err) {
      console.log(err);
    })
  }

  adminFac.deleteCat = function (cat) {
    return $http.delete('/api/categories/'+cat.id)
    .then(function (deleteResponse) {
      return (deleteResponse);
    })
    .catch(function (err) {
      console.log(err);
    })
  }

  adminFac.updateOrderStatus = function(order, updStatus){

    return $http.put('/api/orders/'+order.id,{status: updStatus})
    .then(function (putResponse) {
      return (putResponse.data);
    })
    .catch(function (err) {
      console.log(err);
    })
  }
  return adminFac;

})
