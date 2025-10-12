# FinOS Backend

A Rust-based backend service for financial receipt processing and email ingestion using domain-driven design architecture.

## 🏗️ Architecture

This backend follows **Domain-Driven Design (DDD)** principles with a clean separation of concerns:

```
src/
├── common/           # Shared utilities and application state
│   ├── app_state.rs  # Application state management
│   ├── api_response.rs # Standardized API responses
│   └── db_conn.rs    # Database connection utilities
├── domain/           # Domain-specific modules
│   ├── email/        # Email processing domain
│   │   ├── models.rs     # Email-related data structures
│   │   ├── service.rs    # Email processing business logic
│   │   ├── repository.rs # Email data access layer
│   │   ├── handler.rs    # Email HTTP handlers
│   │   └── routes.rs     # Email API routes
│   ├── receipt/      # Receipt management domain
│   │   ├── models.rs     # Receipt data structures
│   │   ├── service.rs    # Receipt business logic
│   │   ├── repository.rs # Receipt data access
│   │   ├── handler.rs    # Receipt HTTP handlers
│   │   └── routes.rs     # Receipt API routes
│   ├── user/         # User management domain
│   │   ├── models.rs     # User data structures
│   │   ├── service.rs    # User business logic
│   │   ├── repository.rs # User data access
│   │   ├── handler.rs    # User HTTP handlers
│   │   └── routes.rs     # User API routes
│   └── ingestor/     # Email ingestion orchestration
│       ├── service.rs    # Ingestion coordination logic
│       ├── handler.rs    # Ingestion HTTP handlers
│       └── routes.rs     # Ingestion API routes
├── app.rs           # Application setup and route mounting
└── main.rs          # Application entry point
```

## 🚀 Features

- **Email Processing**: Automated Gmail integration for receipt extraction
- **AI-Powered Parsing**: Uses Ollama for intelligent receipt data extraction
- **Receipt Management**: Store and query financial receipts
- **User Management**: User registration and synchronization tracking
- **RESTful API**: Clean HTTP API with standardized responses
- **MongoDB Integration**: Persistent data storage
- **Domain-Driven Design**: Clean architecture with separated concerns

## 🛠️ Tech Stack

- **Language**: Rust
- **Web Framework**: Axum
- **Database**: MongoDB
- **AI Processing**: Ollama
- **Email Integration**: Gmail API via OAuth2
- **Serialization**: Serde (JSON/YAML)
- **Async Runtime**: Tokio

## 📋 Prerequisites

- Rust 1.70+ 
- MongoDB instance
- Ollama with a compatible model
- Gmail API credentials

## ⚙️ Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   cargo build
   ```

3. **Configure environment variables:**
   ```bash
   cp .env-example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017
   DATABASE=fin-os-db
   COLLECTION=receipts
   OLLAMA_MODEL=llama3.1
   ISSUER_EMAILS=receipts@example.com,orders@shop.com
   ```

4. **Set up Gmail API credentials:**
   - Place your `client_secret.json` in the backend root directory
   - Ensure OAuth2 is properly configured for Gmail access

5. **Start Ollama service:**
   ```bash
   ollama serve
   ollama pull llama3.1  # or your preferred model
   ```

## 🏃‍♂️ Running the Application

```bash
cargo run
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
- `GET /health` - Service health status

### User Management
- `GET /users` - Get all active users
- `POST /users` - Register a new user
- `POST /users/sync` - Update user synchronization status

### Receipt Management
- `GET /receipts/:email` - Get receipts for a specific email
- `POST /receipts` - Store new receipts

### Email Processing
- `POST /emails/process` - Trigger email processing

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE` | Database name | `fin-os-db` |
| `COLLECTION` | Default collection name | `receipts` |
| `OLLAMA_MODEL` | Ollama model for AI processing | `llama3.1` |
| `ISSUER_EMAILS` | Comma-separated issuer email addresses | `receipts@example.com` |

### Gmail API Setup

1. Create a Google Cloud Project
2. Enable Gmail API
3. Create OAuth2 credentials
4. Download `client_secret.json`
5. Place in backend root directory

## 🏗️ Development

### Project Structure

The project follows Domain-Driven Design principles:

- **Models**: Domain-specific data structures
- **Services**: Business logic and orchestration
- **Repositories**: Data access layer
- **Handlers**: HTTP request/response handling
- **Routes**: API endpoint definitions

### Adding New Domains

1. Create domain directory: `src/domain/new_domain/`
2. Add modules: `models.rs`, `service.rs`, `repository.rs`, `handler.rs`, `routes.rs`
3. Update `src/domain/mod.rs` with new domain declaration
4. Add to `AppState` if needed

### Database Schema

The application uses MongoDB with the following collections:
- `users` - User accounts and synchronization data
- `receipts` - Financial receipt data
- `emails` - Email processing metadata

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify `MONGO_URI` is correct
   - Ensure MongoDB is running
   - Check network connectivity

2. **Ollama Model Not Found**
   - Run `ollama pull <model_name>`
   - Verify `OLLAMA_MODEL` environment variable

3. **Gmail API Authentication Issues**
   - Verify `client_secret.json` is present
   - Check OAuth2 scopes
   - Ensure credentials are valid

4. **Compilation Errors**
   - Run `cargo clean && cargo build`
   - Check Rust version compatibility
   - Verify all dependencies are available