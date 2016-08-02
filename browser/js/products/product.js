app.config(function ($stateProvider) {

  $stateProvider.state('product', {
      url: '/products/:productId',
      controller: 'ProductController',
      templateUrl: 'js/products/product.html',
      resolve: {
        theProduct: function (ProductsFactory, $stateParams) {
          return ProductsFactory.fetchById($stateParams.productId);
        }
      }
  });

});

app.controller('ProductController', function ($scope, theProduct, $rootScope) {

  $scope.product = theProduct.product;
  $scope.categories = theProduct.categories;

  $scope.addItem=function(){
    $rootScope.$broadcast('addingItemToCart', $scope.product);
  }

});
