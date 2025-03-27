FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Install runtime dependencies and build tools
RUN apk add --no-cache postgresql-client python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies and rebuild bcrypt
RUN npm ci --only=production && \
    npm rebuild bcrypt --build-from-source

# Copy built application and necessary files
COPY --from=builder /usr/src/app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"] 