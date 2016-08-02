// app.directive('searchProduct', function (ProductsFactory) {

//     return {
//         restrict: 'A',
//         scope: {
//           searchProduct: '&'
//         },
//         link: function (scope) {
//           angular.extend(scope, ProductsFactory);

//           scope.searchProduct = function (letter) {
//                 element.bind('keyup', function (event) {
//                     var value = element.val();
//                     if (value.length > 2) {
//                         // search
//                     }
//                 })
//             }

// juke.directive('doubleClick', function (PlayerFactory, SongFactory) {
//   return {
//     restrict: 'A',
//     scope: {
//       doubleClick: '&' // The '&' takes what follows 'onDblClick=' and puts it on our empty isolate scope.
//     },
//     link: function (scope, element) {
//       angular.extend(scope, PlayerFactory);
//       angular.extend(scope, SongFactory);
//       element.on('dblclick', function () {
//         scope.doubleClick();
//       });
//     }
//   };
// });




// Directive
app.directive('search', function () {
    return function ($scope, element) {
        element.bind("keyup", function (event) {
          var val = element.val();
          if(val.length > 2) {
            $scope.search(val);
          }
        });
    };
});

// In Controller
$scope.search= function(val) {
  // fetch data
}
