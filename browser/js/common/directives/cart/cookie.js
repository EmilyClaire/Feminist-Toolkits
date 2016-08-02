// // Update the getItems method to look for the items cookie if the cart is empty. If the items cookie exists, rebuild the cart by looking up the product by the id stored in the cookie:

// app.factory('CartService', function($cookieStore) {


//   function updateItemsCookie() {
//     // Initialize an object to be saved as the cookie
//     var itemsCookie = {};
//     // Loop through the items in the cart
//     angular.forEach(items, function(item, key) {
//       // Add each item to the items cookie,
//       // using the guid as the key and the quantity as the value
//           itemsCookie[key] = item.quantity;
//     });
//     // Use the $cookieStore service to persist the itemsCookie object to the cookie named 'items'
//     $cookieStore.put('items', itemsCookie);
//   }

//   var getItems = function () {
//     // Initialize the itemsCookie variable
//     var itemsCookie;
//     // Check if cart is empty
//     if(!items.length) {
//       // Get the items cookie
//       itemsCookie = $cookieStore.get('items');
//       // Check if the item cookie exists
//       if(itemsCookie) {
//         // Loop through the items in the cookie
//         angular.forEach(itemsCookie, function(item, key) {
//           // Get the product details from the ProductService using the guid
//           SwagService.get({id: key}).then(function(response){
//             var product = response.data;
//             // Update the quantity to the quantity saved in the cookie
//             product.quantity = item;
//             // Add the product to the cart items object using the guid as the key
//             items[product.guid] = product;
//           });
//         });
//       }
//     }
//     // Returns items object
//     return items;
//   }


//   var emptyCart = function() {
//     // Sets items object to an empty object
//     items = {};
//     // Remove the items cookie
//     $cookieStore.remove('items');
//   }

// });
