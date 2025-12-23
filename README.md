# Fragments API Server

A Node.js/Express microservice that implements the Fragments HTTP API for creating, storing, retrieving, updating, deleting, and converting user‑owned data “fragments”. Built for the *Cloud Computing for Programmers* course to practice microservice design, Docker, automated testing, and AWS deployment.

## Features

- **Express API with Versioned Routes**
  - `app.js` wires up middleware, logging, health check, and all `/v1/fragments` routes.
  - Route handlers in `src/routes/api` (e.g., `get.js`, `post.js`, `get-id.js`, `put-id.js`, `delete-id.js`, `get-info.js`) implement the core CRUD and info endpoints.
  - `response.js` centralizes the JSON response shape for success and error cases.

- **Structured Logging**
  - `logger.js` configures Pino for structured, JSON‑formatted logs with appropriate log levels (debug, info, warn, error).
  - Logs are used throughout startup (`server.js`), health checks, and fragment routes.

- **Fragment Data Model & Validation**
  - Fragment operations are routed through a model layer (for example `index.js` and `hash.js`) that hides the underlying storage backend and hashes user identifiers for privacy.
  - Validates content types and sizes, and only accepts supported fragment media types (such as `text/*` and `application/json`).

- **Content Retrieval & Conversion**
  - `GET /v1/fragments` returns a list of fragment IDs (or expanded metadata when `?expand=1` is set).  
  - `GET /v1/fragments/:id` returns raw fragment data with the appropriate `Content-Type`.  
  - `GET /v1/fragments/:id/info` returns fragment metadata (type, owner, size, timestamps).  
  - `GET /v1/fragments/:id.ext` supports type conversion (for example Markdown → HTML and other conversions added in later assignments).

- **Create, Update, Delete**
  - `POST /v1/fragments` parses the request body as a raw `Buffer`, validates type, persists the fragment, and returns metadata plus a `Location` header pointing to the new fragment URL.
  - `PUT /v1/fragments/:id` replaces an existing fragment’s data for the authenticated owner.
  - `DELETE /v1/fragments/:id` removes an existing fragment and its metadata.

- **Environment‑Driven Configuration**
  - Uses `dotenv` and environment variables (configured via `package.json` scripts and `.env`) to control ports, API base URL, and data backends.
  - Local development and CI can switch between in‑memory and AWS‑backed storage via configuration, matching the course assignment requirements.

## Technology Stack

- Node.js 18+
- Express
- Pino for logging
- Jest / Supertest for unit tests and coverage
- Docker and `docker compose` for local multi‑container environments

## Docker & Local Development

The project includes both single‑service and multi‑service compose files:

- `docker-compose.yml` – used for CI and integration, wiring the fragments server to local AWS simulators as required by the assignment.
- `docker-compose.local.yml` – convenience setup for local development (fragments plus supporting services).

Typical local workflow:

Install dependencies
npm install

Run lint + tests
npm test

Start server locally
npm start

Or run the full stack with docker compose (local dev)
docker compose -f docker-compose.local.yml up --build


The server entrypoint is `server.js`, which loads `app.js`, attaches the HTTP server, and listens on the configured port.

## Example Usage

Create a Markdown fragment:

`curl -u user@example.com:password
-H "Content-Type: text/markdown"
--data-binary "Hello Fragments!"
http://localhost:8080/v1/fragments`

Retrieve the fragment as HTML:

`curl -u user@example.com:password
http://localhost:8080/v1/fragments/FRAGMENT_ID.html`

List all fragment IDs for the current user:

`curl -u user@example.com:password
http://localhost:8080/v1/fragments`

## Scripts

Key scripts from `package.json` include:

- `npm start` – run the production server with the configured environment.
- `npm run dev` – run the server in development mode (for example with nodemon, if configured).
- `npm run test` – execute Jest test suites and generate coverage.
- `npm run test:integration` - execute integrations test

## Learning Outcomes

Through this project you:

- Implement a microservice using Express with proper routing, error handling, and logging.
- Containerize the service with Docker and orchestrate it with `docker compose`.
- Practice CI/CD by wiring the project into GitHub Actions, Docker Hub/ECR, and AWS deployments in line with the Fragments assignment specifications.
