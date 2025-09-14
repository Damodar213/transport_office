# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Remove any pnpm files if they exist
RUN rm -f pnpm-lock.yaml .pnpmfile.cjs

# Install dependencies using npm only
RUN npm install --production=false

# Copy source code
COPY . .

# Remove any remaining pnpm files
RUN rm -f pnpm-lock.yaml .pnpmfile.cjs

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
