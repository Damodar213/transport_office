# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything first
COPY . .

# Restore the package.json and package-lock.json from backup
RUN mv package.json.backup package.json
RUN mv package-lock.json.backup package-lock.json
RUN mv next.config.mjs.backup next.config.mjs

# Explicitly remove any pnpm files and force npm usage
RUN rm -f pnpm-lock.yaml .pnpmfile.cjs .pnpm-store
RUN rm -rf node_modules/.pnpm

# Install dependencies using npm only
RUN npm install --production=false

# Remove any remaining pnpm files
RUN rm -f pnpm-lock.yaml .pnpmfile.cjs .pnpm-store
RUN rm -rf node_modules/.pnpm

# Change to the 'a' directory for build and start
WORKDIR /app/a

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]