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

app.controller('ProductController', function ($scope, theProduct, $rootScope, CategoryFactory) {

  $scope.product = theProduct;
  $scope.categories;

  $scope.addItem=function(){
    $rootScope.$broadcast('addingItemToCart',theProduct);
  }

});
