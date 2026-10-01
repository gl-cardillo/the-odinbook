# Odinbook

A full-stack social network inspired by Facebook, built as the final project of [The Odin Project](https://www.theodinproject.com/) curriculum.

**Live demo:** _add the deployed client URL here_ (use "Login without an account" to try it)

## Features

- Sign up, log in, or use a guest account
- Create posts with images, like and comment, reply to comments
- Send, accept and decline friend requests
- Notifications for likes, comments and friendships
- Search users and browse suggested profiles
- Edit your profile, profile picture and cover

## Tech stack

| | |
| --- | --- |
| **Client** | React 19, TypeScript, Vite, React Router, React Hook Form + Yup |
| **Server** | Node.js, Express 5, TypeScript, MongoDB + Mongoose, JWT auth |
| **Storage** | AWS S3 (images, uploaded via presigned URLs) |
| **Testing** | Vitest, Supertest, mongodb-memory-server |
| **Hosting** | Vercel |

## Getting started

Requires Node.js 22+ and a MongoDB database.

```bash
git clone https://github.com/gl-cardillo/the-odinbook.git
cd the-odinbook
npm install --prefix server
npm install --prefix client
```

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=any-long-random-string
TEST_PASSWORD=password-of-the-guest-account
# optional, only this origin may call the API (e.g. https://your-client.vercel.app)
CLIENT_URL=

AWS_BUCKET_NAME=...
AWS_BUCKET_REGION=...
AWS_ACCESS_S3_KEY_ID=...
AWS_SECRET_S3_ACCESS_KEY=...
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Run both in separate terminals:

```bash
npm run dev --prefix server   # http://localhost:5000
npm run dev --prefix client   # http://localhost:3000
```

## Scripts

| Folder | Command | Description |
| --- | --- | --- |
| `server` | `npm run dev` | Start the API with live reload |
| `server` | `npm test` | Run the API tests (in-memory MongoDB, no `.env` needed) |
| `server` | `npm run build` / `npm start` | Compile to `dist/` and run it |
| `client` | `npm run dev` | Start the Vite dev server |
| `client` | `npm run build` | Type-check and build to `dist/` |
| `client` | `npm run lint` | Lint with ESLint |

## Project structure

```
client/   React app (components, shared types, API helpers)
server/   Express API (routes, controllers, Mongoose models, tests)
```
