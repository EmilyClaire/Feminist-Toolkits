app.config(function ($stateProvider) {
    $stateProvider.state('updateProduct', {
        url: '/update-product/:id',
        templateUrl: 'js/update-product/update-product.html',
        controller: 'UpdateProductController',
        resolve: {
        	productBundle: function($stateParams,ProductsFactory){
        		return ProductsFactory.fetchById($stateParams.id);
        	}
        }
    });
});


app.controller('UpdateProductController', function ($state,$scope, productBundle,$stateParams,ProductsFactory) {
	$scope.somethingWrong=false;
	if($stateParams.id){
		$scope.product=productBundle.product;
		$scope.categories=productBundle.categories;
		$scope.currPhotoUrl=$scope.product.photoUrl;
		$scope.goal='update';
	}
	else{
		$scope.goal='create';
	}
	$scope.updateCurrPhoto=function(url){
		$scope.currPhotoUrl=url;
	}
	$scope.submitUpdate=function(url){
		var productPromise;
		if($scope.product.photoUrl=''){
			$scope.product.photoUrl=null;
		}
		if($scope.goal==='update'){
			productPromise=ProductsFactory.update($scope.product.id,$scope.product);
		}
		else if($scope.goal==='create'){
			productPromise=ProductsFactory.create($scope.product);
		}
		productPromise.then(function(result){
			if(result){
				var product=result.product;
				$state.go('products', {id:result.id||product.id});
			}
			else{
				$scope.somethingWrong=true;
			}
		})
	}

});
