# FinOS Backend

FinOS is a Rust backend that connects to Gmail, ingests purchase receipts, and persists structured transactions.  
Users authenticate with Google OAuth, after which the service issues a JWT session that is required to call the protected APIs.

---

## 1. Features
- Google OAuth 2.0 + PKCE sign-in flow (`/auth/google/login` and `/auth/google/callback`).
- JWT session management (signed with `JWT_SECRET`, delivered via cookie or bearer header).
- Gmail ingestion pipeline that pulls new receipts, parses them, and stores transactions.
- Daily (configurable) ingestion job that runs in a Tokio background task.
- MongoDB repositories for users, tokens, receipts, and email metadata.
- Domain Driven Design layout with isolated domain services.

---

## 2. Project Layout
```
src/
├── app.rs                 # App builder, route mounting, background jobs
├── main.rs                # Binary entrypoint
├── common/
│   ├── api_response.rs    # Standard API response wrapper
│   ├── app_state.rs       # Shared state (services + JWT manager)
│   ├── db_conn.rs         # Mongo connection helper
│   └── jwt.rs             # Token issuance + Axum middleware
└── domain/
    ├── auth/              # Google OAuth + token persistence
    ├── email/             # Gmail client and parsing pipeline
    ├── ingestor/          # Orchestrates periodic receipt ingest
    ├── receipt/           # Receipt store + API handler
    └── user/              # User repository & service
```

---

## 3. Prerequisites
- Rust toolchain (1.70 or newer recommended).
- Running MongoDB instance.
- Ollama installed with the model specified by `OLLAMA_MODEL`.
- Google Cloud project with Gmail API enabled.
- `client_secret_web.json` downloaded from Google (placed in `backend/`).

---

## 4. Configuration
Create a `.env` file (copy from `.env-example` if present) and provide the following:

| Variable        | Description                                        | Example                                  |
| --------------- | -------------------------------------------------- | ---------------------------------------- |
| `MONGO_URI`     | Mongo connection string                            | `mongodb://localhost:27017`              |
| `DATABASE`      | Mongo database name                                | `fin-os-db`                              |
| `OLLAMA_MODEL`  | Name of the Ollama model used for parsing          | `llama3.1`                               |
| `ISSUER_EMAILS` | JSON array of trusted sender addresses             | `["receipts@example.com","orders@shop"]` |
| `JWT_SECRET`    | Shared secret for signing/verifying session JWTs   | `super-secret-change-me`                 |

Also ensure `client_secret_web.json` is placed at repo root and contains the redirect URI used by the app.

---

## 5. Running Locally
```bash
cd backend
cargo run
```

The server listens on `http://localhost:3000`.  
During startup a background job is spawned via `start_sync_job` (interval defaults to 60 seconds; adjust in `main.rs` as needed).

---

## 6. Authentication Flow
1. **Login**  
   `GET /auth/google/login` redirects to Google with PKCE + Gmail readonly scope.
2. **Callback**  
   `GET /auth/google/callback` exchanges the auth code, persists tokens, and issues a signed JWT cookie (`finos_session`).  
   The response redirects to `/app`.
3. **Protected calls**  
   Downstream requests must include the JWT either as:
   - Cookie: `finos_session=<token>`
   - Header: `Authorization: Bearer <token>`

`common::jwt::require_jwt` validates the token on guarded routes and inserts the decoded claims.

---

## 7. Available Routes
| Method | Path                     | Auth? | Description                                  |
| ------ | ------------------------ | ----- | -------------------------------------------- |
| GET    | `/`                      | No    | Simple hello world response                  |
| GET    | `/auth/google/login`     | No    | Initiate Google OAuth PKCE flow              |
| GET    | `/auth/google/callback`  | No    | Exchange code, set session cookie            |
| GET    | `/receipts/:email`       | Yes   | Fetch receipts for an email (JWT protected)  |

The receipt route uses the JWT middleware attached in `domain/receipt/routes.rs`.

---

## 8. Gmail + Ollama Integration
- `EmailService::query_and_process_untracked` fetches unseen Gmail messages, filters by keywords, converts HTML to text, and sends it to Ollama for structured extraction.
- Parsed receipts get handed to `ReceiptService` and persisted.
- `IngestorService::sync_receipts` loops through active users and orchestrates the pipeline.

When running locally you may need to start Ollama and ensure the model is available:
```bash
ollama serve
ollama pull <model-name>
```

---

## 9. Development Notes
- The codebase is still evolving; not every domain exposes HTTP routes yet.
- JWT signing currently uses HS256 via the shared secret. Rotate `JWT_SECRET` regularly.
- `start_sync_job` uses `tokio::time::interval`—tweak the cadence or integrate a cron scheduler if needed.
- Mongo collections are created lazily by repositories (`users`, `receipts`, `tokens`, etc.).

For questions or contributions, review the domain modules—each follows the pattern: `models`, `repository`, `service`, `handlers`, `routes`.
