app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products',
        controller: 'ProductsController',
        templateUrl: 'js/products/products.html',
        resolve: {
            products: function (ProductsFactory) {
                return ProductsFactory.fetchAll();
            },
            categories: function (CategoryFactory) {
                return CategoryFactory.fetchAll();
            }
        }
    });
});

app.controller('ProductsController', function ($scope, products, categories) {

    $scope.products = products;
    $scope.categories = categories;

    $scope.categoryFilter = function (value) {
        if ($scope.selectedCategory) {
            return value.categories.some(function (cat) {
                return cat.id === $scope.selectedCategory.id;
            });
        } else {
            return true;
        }
    }

});
