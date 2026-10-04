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

|             |                                                                 |
| ----------- | --------------------------------------------------------------- |
| **Client**  | React 19, TypeScript, Vite, React Router, React Hook Form + Yup |
| **Server**  | Node.js, Express 5, TypeScript, MongoDB + Mongoose, JWT auth    |
| **Storage** | AWS S3 (images, uploaded via presigned URLs)                    |
| **Testing** | Vitest, Supertest, mongodb-memory-server, Cypress               |
| **Hosting** | Vercel                                                          |

## Getting started

Requires Node.js 22+ and a MongoDB database.

```bash
git clone https://github.com/gl-cardillo/the-odinbook.git
cd the-odinbook
npm install   # every package, and builds the shared one
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

Start the API and the client together:

```bash
npm run dev   # API on http://localhost:5000, client on http://localhost:3000
```

## Scripts

Run from the repository root:

| Command               | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `npm run dev`         | Start the API and the client with live reload                   |
| `npm test`            | API tests on an in-memory MongoDB, no `.env` needed             |
| `npm run e2e`         | Cypress tests of the client against the API on an in-memory one |
| `npm run lint`        | Lint with ESLint                                                |
| `npm run typecheck`   | Type-check every package                                        |
| `npm run format`      | Format with Prettier                                            |
| `npm run build`       | Build the shared package, the API and the client                |
| `npm start -w server` | Run the built API                                               |

## Deployment

The client and the API are two Vercel projects deployed from this repository, with **Root Directory** set to `client` and `server`. Both use the `shared` package, so Vercel must build from the whole repository: connect the GitHub repository to both projects (every push to `main` deploys) and keep "Include files outside the root directory" enabled.

## Upgrading an existing database

Older versions stored notifications inside users and replies inside comments. Move them to their own collections once, after deploying:

```bash
npm run migrate -w server              # dry run, only reports what would change
npm run migrate -w server -- --apply   # makes the changes, safe to run again
```

## Project structure

```
client/   React app (components, queries, API helpers, Cypress tests)
server/   Express API (routes, controllers, Mongoose models, tests)
shared/   types of the API answers and limits used by both
```
