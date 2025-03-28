# Email Warmup Service

A microservice for email warmup that handles email sending with quota management and validation, built with NestJS and React.

## Features

- Email sending with quota management
- Email validation and reachability checking
- Gmail OAuth2 integration for secure email access
- Queue-based processing with RabbitMQ
- Comprehensive logging with Winston
- TypeORM for database management
- Swagger API documentation
- JWT-based authentication
- React frontend with Material-UI

## Project Structure

```
.
├── backend/                # Backend NestJS application
│   ├── src/               # Source code
│   │   ├── domain/        # Core business logic and entities
│   │   │   ├── email/     # Email domain
│   │   │   │   ├── entities/      # Domain entities
│   │   │   │   ├── repositories/  # Repository interfaces
│   │   │   │   └── services/      # Domain service interfaces
│   │   │   └── queue/     # Queue domain
│   │   │       └── services/      # Queue service interfaces
│   │   ├── application/   # Application services and controllers
│   │   │   ├── auth/     # Authentication
│   │   │   │   ├── controllers/  # Auth endpoints
│   │   │   │   ├── services/     # Auth business logic
│   │   │   │   └── dto/          # Data transfer objects
│   │   │   └── email/    # Email operations
│   │   │       ├── controllers/  # Email endpoints
│   │   │       ├── services/     # Email business logic
│   │   │       └── dto/          # Data transfer objects
│   │   └── infrastructure/# External implementations
│   │       ├── email/    # Email infrastructure
│   │       │   ├── entities/     # Database entities
│   │       │   └── repositories/ # Repository implementations
│   │       └── queue/    # Queue infrastructure
│   │           └── services/     # Queue implementations
│   ├── Dockerfile         # Backend container configuration
│   └── package.json       # Backend dependencies
├── frontend/              # Frontend React application
│   ├── src/              # Frontend source code
│   │   ├── components/   # Reusable React components
│   │   ├── contexts/     # React contexts (Auth, etc.)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static files
│   └── package.json      # Frontend dependencies
├── docker-compose.yml     # Docker services configuration
└── README.md             # Project documentation
```

## Architecture

The application follows Clean Architecture principles with clear separation of concerns:

### Key Components

1. **Domain Layer**
   - Core business logic and entities
   - Repository interfaces
   - Service interfaces
   - No external dependencies

2. **Application Layer**
   - Controllers and DTOs
   - Application services
   - Use case orchestration
   - Depends only on domain layer

3. **Infrastructure Layer**
   - Database implementations
   - External service integrations
   - Queue implementations
   - Depends on domain layer

4. **Frontend Layer**
   - React components
   - Context-based state management
   - API service integration
   - Material-UI components

## Flow

1. **Authentication Flow**
   - User registers/logs in through frontend
   - JWT token is stored in localStorage
   - Token is used for all subsequent API calls

2. **Email Account Linking**
   - User clicks "Link Gmail Account"
   - Frontend redirects to Gmail OAuth consent screen
   - User authorizes the application
   - Backend stores Gmail credentials securely

3. **Email Warmup Process**
   - System schedules warmup emails based on quota
   - Emails are queued in RabbitMQ
   - Email processor handles sending with retry logic
   - Quota is updated after successful sends

4. **Monitoring and Statistics**
   - Real-time dashboard shows email stats
   - Quota usage tracking
   - Success/failure rates
   - Activity charts

## API Endpoints

### Authentication
```
POST /auth/register - Register a new user
POST /auth/login - Login and get JWT token
```

### Email Credentials
```
POST /email-credentials - Add new email credentials
PUT /email-credentials/:id - Update email credentials
GET /email-credentials - List all email credentials
GET /email-credentials/:id - Get specific credentials
POST /email-credentials/:id/refresh - Refresh tokens
```

### Email Operations
```
POST /email/send - Queue an email for sending
GET /email/stats - Get email statistics
GET /email/logs - Get detailed email logs
GET /email/quota - Get quota information
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js v20 (for local development only)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/hdarwish/warmup-email-service.git
cd warmup-email-service
```

2. Copy the example environment files:
```bash
# Backend environment
cp backend/.env.example backend/.env
# Frontend environment
cp frontend/.env.example frontend/.env
# Edit both .env files with your configuration
```

3. Start the services:
```bash
docker-compose up -d
```

The services will be available at:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- Swagger UI: http://localhost:3000/api
- RabbitMQ Management: http://localhost:15672 (guest/guest)

### Local Development

If you prefer to run the services separately for development:

1. Start the infrastructure services:
```bash
docker-compose up -d postgres rabbitmq
```

2. Backend Setup:
```bash
cd backend
npm install
npm run migration:run
npm run start:dev
```

3. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

### Development Commands

Backend:
```bash
cd backend
npm run build        # Build the project
npm run format       # Format code
npm run lint         # Lint code
npm test            # Run tests
npm run test:e2e    # Run e2e tests
```

Frontend:
```bash
cd frontend
npm run build       # Build the project
npm run lint        # Lint code
npm test           # Run tests
```

### API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:3000/api
- ReDoc: http://localhost:3000/api-json

## Environment Variables

### Backend Environment Variables
Configure in `backend/.env`:
```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/email_warmup

# Message Queue
RABBITMQ_URL=amqp://guest:guest@localhost:5672


# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h

# Gmail OAuth2
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/email-credentials/gmail/callback

# Email Settings
DEFAULT_EMAIL_QUOTA=50
EMAIL_RETRY_DELAY=300

# Email Validation
THROWAWAY_DOMAINS=tempmail.com,throwawaymail.com,temp-mail.org,tempmail.plus,tempmail.net,tempmailaddress.com,tempmail.ninja,tempmail.website,tempmail.ws,tempmail.xyz

# Email Settings
MAX_EMAIL_QUOTA=500

# Warmup Settings
WARMUP_RECIPIENTS=your-test-email1@gmail.com,your-test-email2@gmail.com
```

### Frontend Environment Variables
Configure in `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

Note: When using Docker Compose, database and message queue configurations are handled automatically.

