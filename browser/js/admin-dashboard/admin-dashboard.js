app.config(function ($stateProvider) {
  $stateProvider.state('admin-dashboard',{
    url: '/admin/dashboard',
    templateUrl: '/js/admin-dashboard/admin-dashboard.html',
    controller: 'AdminDashboard'
  })

});

app.controller('AdminDashboard',function ($scope, AuthService, UserFactory, OrderFactory, $state, ProductsFactory, CategoryFactory, AdminFactory) {

  $scope.isAdmin = AuthService.isAuthenticated && AuthService.isAdmin;
  if (!$scope.isAdmin){
    console.log("Git out!")
    $state.go('home')};

  $scope.showAll = function(elem){
    $scope[elem].numToShow = $scope[elem].length;
  }

  $scope.adminPromoClicked = false;
  $scope.deleteCatClicked = false;
  $scope.statusUpdClicked = false;

  $scope.makeAdmin = function(user){
    AdminFactory.makeAdmin(user)
    .then(function () {
      $scope.adminPromoClicked= false;
      UserFactory.fetchAll()
      .then(function (returnedUsers) {
        $scope.users = returnedUsers;
      })
    })
  }
  $scope.updOrderStatus = function(order){
    AdminFactory.updateOrderStatus(order, $scope.newStatus)
    .then(function () {
      $scope.newStatus= null;
      OrderFactory.fetchAll()
      .then(function (returnedOrders) {
        $scope.orders = returnedOrders;
        $scope.statusUpdClicked = null;
      })
    })
  }
  $scope.deleteCat = function(cat){
    AdminFactory.deleteCat(cat)
    .then(function () {
      $scope.deleteCatClicked= false;
      CategoryFactory.fetchAll()
      .then(function (returnedCats) {
        $scope.categories = returnedCats;
      })
    })
  }
  $scope.togglePromoClick = function(user){
    if ($scope.adminPromoClicked) {
      $scope.adminPromoClicked=false
    } else {$scope.adminPromoClicked=user}
  }

  $scope.toggleCatClick = function (cat) {
    if ($scope.deleteCatClicked) {
      $scope.deleteCatClicked = false
    } else {$scope.deleteCatClicked=cat}
  }

  $scope.openStatusUpdate = function (order) {
    $scope.statusUpdClicked=order;
  }

  ProductsFactory.fetchAll()
  .then(function(returnedProds){
    $scope.products = returnedProds;
  })

  CategoryFactory.fetchAll()
  .then(function (returnedCats) {
    $scope.categories = returnedCats;
  })

  OrderFactory.fetchAll()
  .then(function (returnedOrders) {
    $scope.orders = returnedOrders;
  });

  UserFactory.fetchAll()
  .then(function (returnedUsers) {
    $scope.users = returnedUsers;
  });


});
