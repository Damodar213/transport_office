# Use Node.js 18
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy everything first
COPY . .

# Restore pnpm lockfile if it exists
RUN if [ -f pnpm-lock.yaml.backup ]; then mv pnpm-lock.yaml.backup pnpm-lock.yaml; fi

# Install dependencies using pnpm
RUN pnpm install --no-frozen-lockfile

# Change to the 'a' directory for build and start
WORKDIR /app/a

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]