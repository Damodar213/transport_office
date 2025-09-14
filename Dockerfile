# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (from root)
COPY package.json package-lock.json* ./

# Remove any pnpm files if they exist
RUN rm -f pnpm-lock.yaml .pnpmfile.cjs

# Install dependencies using npm only
RUN npm install --production=false

# Copy the 'a' directory (where the Next.js app is located)
COPY a/ ./a/

# Remove any remaining pnpm files
RUN rm -f pnpm-lock.yaml .pnpmfile.cjs

# Change to the 'a' directory for build and start
WORKDIR /app/a

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]