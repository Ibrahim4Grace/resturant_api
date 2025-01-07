# Use Node.js base image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json package-lock.json ./

# Install ALL dependencies without triggering postinstall
RUN npm install --ignore-scripts

# Copy the rest of the application
COPY . .

# Compile TypeScript manually
RUN npm run build

# Expose port 8000
EXPOSE 8000

# Set development environment
ENV NODE_ENV=development

# Start the application in development mode
CMD ["npm", "run", "dev"]
