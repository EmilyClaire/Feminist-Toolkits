app.directive('addReview', function ($state, AuthService, $stateParams, $http) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/add-review/add-review.html',
        link: function (scope) {

            scope.isLoggedIn = function(){
                return AuthService.isAuthenticated();
            }

            scope.addReview =function(){
                $stateParams.productId;
            };

            scope.stars = [ 5, 4, 3, 2, 1];

            scope.selectedStars = 5;

            scope.addReview = function(stars, review){

            };
        }
    }
});
