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

  return adminFac;

})
