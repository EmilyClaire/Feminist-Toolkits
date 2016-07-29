juke.directive('Reviews', function () {
  return {
    restrict: 'E',
    templateUrl: '/js/common/directives/reviews/reviews.html',
    scope: {
      reviews: '='
    }
  };
});
