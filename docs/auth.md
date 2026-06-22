# Auth Notes

## JWT flow

- `POST /auth/register` creates a student or vendor account and returns an access token.
- `POST /auth/login` verifies credentials and returns an access token.
- `GET /auth/me` checks the current token and returns the authenticated user context.

## Authorization

- `authenticateRequest` reads a Bearer token and attaches `userId` and `role` to the request.
- `authorizeRoles(...)` blocks routes unless the caller has one of the allowed roles.

## Token contents

- `userId`
- `role`