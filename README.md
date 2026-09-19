# One More Revision — Frontend

Angular 19 + TypeScript + Angular Material.

## Run locally
Prerequisites: Node.js 20+.

`npm install`
`npm start`

API base URL is configured in `src/environments/environment.ts` (local: `http://localhost:8080/api`) and `environment.prod.ts` (production: `https://one-more-revision.onrender.com/api`). Production builds swap in `environment.prod.ts` automatically.

On Render, set `CORS_ALLOWED_ORIGIN` to your Vercel app URL so the browser can call the API.

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
