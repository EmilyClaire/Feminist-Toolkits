app.directive('addReview', function ($state, AuthService, $http, Session, ReviewsFactory) {
    return {
        restrict: 'E',
        scope: {
            productId: '='
        },
        templateUrl: 'js/common/directives/add-review/add-review.html',
        link: function (scope) {

            scope.isLoggedIn = function(){
                return AuthService.isAuthenticated();
            }

            scope.stars = [ 5, 4, 3, 2, 1];

            scope.addReview = function(stars, review){
                ReviewsFactory.addReview(stars, review, scope.productId)
                .then(function(newReview){
                    $state.go('reviews', {productId: newReview.productId});
                });
            }
        }
    }
});
