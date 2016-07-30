app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html',
        resolve: {
          allProducts: function (ProductsFactory) {
            return ProductsFactory.fetchAll();
          }
        }
    });

    $stateProvider.state('products.category', {
        url: '/:categoryId',
        resolve: {
          allProducts: function (ProductsFactory, $stateParams) {
            return ProductsFactory.fetchAll($stateParams.categoryId);
          }
        }
    });

});

app.controller('ProductsController', function ($scope, allProducts, CategoryFactory) {

    $scope.products = allProducts;

    CategoryFactory.fetchAll()
    .then(function (categories) {
        $scope.categories = categories;
    });

});
