# moneyMgrBackend

The core REST API behind [MoneyMgr](https://github.com/RohanPrasadGupta/moneyMgr) — an Express + MongoDB backend that stores day-to-day transactions, categories, and the shared currency list. It is one of two sibling backends the frontend talks to; the other, [`stock_analysis_backend`](../stock_analysis_backend), handles stock trades and investment capital.

This is a **single-user, unauthenticated API** — there is no login system anywhere in the stack, by design.

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js, [Express](https://expressjs.com/) 5 |
| Database | MongoDB via [Mongoose](https://mongoosejs.com/) 8 |
| Caching | Redis (response caching on the read-heavy analysis/report endpoints) |
| Middleware | `cors`, `cookie-parser`, `dotenv` |
| Dev tooling | `nodemon` (used for both `start` and `dev`) |

`bcrypt`, `bcryptjs`, and `jsonwebtoken` are installed but never imported anywhere — leftover scaffolding from a template, not wired into any route. `xlsx` is used only by the standalone `inserDataExcel.js` import script, not by the running server.

## How it works

### Startup (`server.js`)

1. Loads environment variables from `config.env`.
2. Connects to MongoDB Atlas using a connection string built from `USER_NAME` and `PASSWORD` (the host/cluster/db name are hardcoded in `server.js`, not read from `MONGODB_URI`).
3. **Seeds the currency collection once, on first boot only** — if `Currency.countDocuments() === 0`, it inserts:
   - `{ code: "THB", name: "Thai Baht", symbol: "฿", isDefault: true }`
   - `{ code: "NPR", name: "Nepalese Rupee", symbol: "₨", isDefault: false }`

   This never runs again once at least one currency document exists, so it will not "reset" a currency list you've since edited.
4. Wraps the Express app in `http.createServer(app)` and listens on `process.env.PORT` (falls back to `5000`; `config.env` sets it to `8000`).

### Request pipeline (`app.js`)

- `express.json()` body parsing, `cookie-parser` (registered but nothing in the app actually sets/reads cookies — no auth uses it today)
- CORS with an explicit origin allow-list (localhost dev ports, the deployed Netlify frontend, and AWS Elastic Beanstalk/Amplify URLs), `credentials: true`
- `GET /` — plain-text health check (`"API is running..."`)
- Three routers, all mounted under `/api`: `dataRoutes`, `categoryRoutes`, `currencyRoutes`

`middleware/` and `config/` exist as directories but are currently empty — no custom middleware is registered beyond the three packages above.

## Data models

### `Data` (transactions) — `models/dataModel.js`

| Field | Type | Notes |
|-------|------|-------|
| `date` | Date | required |
| `account` | String | required |
| `category` | String | required — a plain category **name**, not a foreign key |
| `note` | String | optional |
| `currency` | String | required, uppercase, trimmed, **default `"THB"`** |
| `type` | String | required, `enum: ["Income", "Expense"]` |
| `amount` | Number | required |

### `Category` — `models/categoryModel.js`

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | required |
| `categoryType` | String | required (free text — "Income"/"Expense" by convention, not an enum) |
| `currency` | String | required, uppercase, trimmed, **default `"THB"`** |

### `Currency` — `models/currencyModel.js`

| Field | Type | Notes |
|-------|------|-------|
| `code` | String | required, **unique**, uppercase, trimmed (e.g. `"THB"`, `"NPR"`) |
| `name` | String | required, trimmed |
| `symbol` | String | required, trimmed |
| `isDefault` | Boolean | default `false` |

Because Mongoose `default` only applies to fields left `undefined` at creation time, any `Data`/`Category` document created **before** the `currency` field existed in the schema simply doesn't have it in the database — there is no backfill/migration script. Clients reading old records need their own fallback (the moneyMgr frontend does this).

## API reference

All routes are mounted under `/api`. Responses generally follow a `{ message, data }` (or `{ message, error }`) shape.

### Currency — `routes/currencyRoutes.js` → `controller/currencyController.js`

| Method | Path | Description |
|--------|------|--------------|
| `GET` | `/api/currency` | List all currencies |
| `POST` | `/api/currency` | Create a currency. If `isDefault: true` is sent, every other currency's `isDefault` is unset first |
| `PUT` | `/api/currency/:id` | Update a currency (same "only one default" behavior, excluding itself) |
| `DELETE` | `/api/currency/:id` | Delete a currency |

### Category — `routes/categoryRoutes.js` → `controller/categoryController.js`

| Method | Path | Description |
|--------|------|--------------|
| `GET` | `/api/category` | List all categories |
| `POST` | `/api/category` | Create a category (`currency` falls back to `"THB"` explicitly in the controller, on top of the schema default) |
| `PUT` | `/api/category/:id` | Update a category (same `currency` fallback) |
| `DELETE` | `/api/category/:id` | Delete a category |

### Transactions & reports — `routes/dataRoutes.js` → `controller/dataController.js`

| Method | Path | Description |
|--------|------|--------------|
| `POST` | `/api/data` | Create a transaction |
| `GET` | `/api/data` | All transactions, sorted by `date` desc |
| `GET` | `/api/data/:year/:month` | Transactions for one month (month can be a number or a full name like `"August"`) |
| `GET` | `/api/dataPerYear/:year` | `{ IncomeArray, ExpensesArray }` — two 12-element arrays, summed per calendar month |
| `GET` | `/api/dataReportAll` | `{ incomeTypes, expenseTypes }` — all-time totals grouped by category name |
| `GET` | `/api/dataAnalysis/:year` | Same category-grouped totals, scoped to one year |
| `GET` | `/api/dataAnalysis/:year/:month` | Same category-grouped totals, scoped to one month |
| `GET` | `/api/data/report` | Filtered raw transaction list — query params `startDate`, `endDate` (required), optional `category` |
| `GET` | `/api/data/:id` | Single transaction (404 if missing) |
| `PUT` | `/api/data/:id` | Update a transaction |
| `DELETE` | `/api/data/:id` | Delete a transaction |

**Note on route order:** the static report/analysis routes are declared before `/api/data/:id` in `dataRoutes.js` — that ordering matters in Express, or `:id` would greedily match paths like `report` or `dataReportAll`.

## Business logic worth knowing

- **Category/income/expense aggregation** (`dataReportAll`, `dataAnalysis/:year`, `dataAnalysis/:year/:month`) groups by the raw `category` string on each transaction and sums `amount` — there's no join against the `Category` collection and **no currency conversion**, so totals across mixed currencies are a simple sum, not a true multi-currency aggregate.
- **`dataPerYear/:year`** returns two 12-length arrays indexed by `date.getMonth()` (0 = January) for month-by-month charting.
- **Currency "only one default" enforcement** runs a non-transactional `updateMany({ isDefault: false })` before saving the new/edited default — there is a theoretical race condition under concurrent writes, though this is a single-user app in practice.
- **Redis caching**: most `GET` report/aggregate endpoints are cached with a 4-hour TTL, keyed per endpoint (some further namespaced by year/month). Any write (`createData`, `updateData`, `deleteData`) calls `clearCache()`, which does a **full `flushDb()`** on the Redis instance — this clears the entire Redis database, not just money-manager-prefixed keys, so don't share this Redis instance with unrelated services. `getAllData`'s own caching code exists but is currently commented out (disabled).

## Environment variables

Create a `config.env` file in the project root (gitignored, never commit real values):

```env
PORT=8000
USER_NAME=your-mongodb-atlas-username
PASSWORD=your-mongodb-atlas-password
REDIS_URL=redis://default:password@host:port
```

| Variable | Used for |
|----------|----------|
| `USER_NAME` | MongoDB Atlas username, interpolated into the connection string in `server.js` |
| `PASSWORD` | MongoDB Atlas password, interpolated into the connection string in `server.js` |
| `PORT` | HTTP server port (defaults to `5000` if unset) |
| `REDIS_URL` | Redis connection URL used for response caching |

`config.env` also defines `MONGODB_URI`, `PASSWORD_rohg505`, `JWT_SECRET`, `NODE_ENV`, `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` — none of these are actually read by any code path today (dead/reserved config left over from earlier iterations or planned features).

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or any MongoDB instance — update the connection logic in `server.js` if not using Atlas)
- A Redis instance reachable via `REDIS_URL`

### Install and run

```bash
git clone <this-repo-url>
cd moneyMgrBackend
npm install
# create config.env with PORT, USER_NAME, PASSWORD, REDIS_URL
npm start
```

`npm start` and `npm run dev` are identical — both run `nodemon server.js`, which restarts on file changes and is used for both development and the currently-configured production start.

The API listens on `http://localhost:<PORT>` (default `5000`, or `8000` per the example `config.env`). Point moneyMgr's `NEXT_PUBLIC_API_URL` at this server.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the server via `nodemon server.js` |
| `npm run dev` | Same as `npm start` |
| `npm test` | Not implemented (placeholder script) |

## Project structure

```
moneyMgrBackend/
├── app.js                # Express app: middleware, CORS, route mounting
├── server.js              # Entry point: env loading, DB connect, currency seed, HTTP listen
├── config.env              # Local env vars (gitignored)
├── controller/
│   ├── dataController.js   # Transactions + analysis/report aggregation + Redis caching
│   ├── categoryController.js
│   └── currencyController.js
├── models/
│   ├── dataModel.js        # Transaction schema
│   ├── categoryModel.js
│   └── currencyModel.js
├── routes/
│   ├── dataRoutes.js
│   ├── categoryRoutes.js
│   └── currencyRoutes.js
├── middleware/              # (currently empty)
├── config/                  # (currently empty)
└── inserDataExcel.js         # One-off script for bulk-importing transactions from an Excel export
```

## Related repos

- **[moneyMgr](https://github.com/RohanPrasadGupta/moneyMgr)** — the Next.js frontend that consumes this API (and `stock_analysis_backend`)
- **`stock_analysis_backend`** — sibling backend for the stock ledger and stock/coin/SIP investment capital; it does not share a database or know about this repo's `Currency` collection — it just persists whatever currency code string the frontend sends

## Known gaps

- No authentication — anything that can reach the API and pass the CORS check has full read/write access
- No data migration for records created before the `currency` field existed
- Several `config.env` variables and npm dependencies (`bcrypt`, `bcryptjs`, `jsonwebtoken`) are unused leftovers, not active functionality
- `getAllData`'s caching path is present but disabled in code
