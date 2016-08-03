app.config(function ($stateProvider) {

    $stateProvider.state('products', {
        url: '/products/list/:categoryId',
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

app.controller('ProductsController', function ($scope, products, categories,$stateParams) {

    $scope.products = products;
    $scope.categories = categories;
    $scope.categories.unshift({name:'All'})
    if($stateParams.categoryId){
        $scope.selectedCategory={};
        $scope.selectedCategory.id=Number($stateParams.categoryId);
    }
    else{
        $scope.selectedCategory=$scope.categories[0];
    }
    $scope.categoryFilter = function (value) {
        if($scope.selectedCategory.name==='All'){
            return true;
        }
        if ($scope.selectedCategory) {
            return value.categories.some(function (cat) {
                if(cat.id === $scope.selectedCategory.id){
                    $scope.selectedCategory=cat;
                    return true;
                }
                else{return false}
            });
        } else {
            return true;
        }
    }

});
