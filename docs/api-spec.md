# FoodHub API Spec Draft

## Core resources

- `POST /auth/register` - student/vendor account creation
- `POST /auth/login` - get session tokens
- `GET /stalls` - browse stalls with search/filter
- `GET /stalls/:stallId` - stall details and menu items
- `GET /menu-items` - browse/search menu items
- `POST /reviews` - create a stall review
- `GET /reviews/stall/:stallId` - list reviews and rating summary for a stall
- `PATCH /reviews/:reviewId` - edit own review
- `DELETE /reviews/:reviewId` - delete own review
- `POST /favorites` - add stall or menu item to favorites
- `GET /favorites` - list user favorites
- `DELETE /favorites` - remove stall or menu item from favorites
- `GET /budgets/me` - view current budget settings

## MongoDB collections

- `users`
- `stalls`
- `menuitems`
- `reviews`
- `favorites`
- `budgets`

## Key relationships

- A vendor user owns one or more stalls.
- A stall has many menu items.
- A user can leave at most one review per stall.
- A user can favorite either a stall or a menu item.
- A user can have one budget profile at a time.