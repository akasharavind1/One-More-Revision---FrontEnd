# One More Revision — Frontend

Angular 19 + TypeScript + Angular Material.

## Run locally
Prerequisites: Node.js 20+.

`npm install`
`npm start`

The development app expects the backend at `http://localhost:8080`. For a simple local setup, add an Angular dev-server proxy or serve the backend through the same origin. A production reverse proxy should route `/api` to the backend.

## Build
`npm run build`

## Features
- JWT login and route guard
- Question Bank with server-side search/filter/pagination
- Excel import + validation preview + confirmation
- Study toggle and confirmed practice count changes
- Question CRUD actions
- Workspace Notes linked to questions and scoped to the authenticated user
- Category management
- Responsive SaaS dashboard
