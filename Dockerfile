# Use a lightweight Node.js version
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files FIRST to leverage Docker caching.
# This ensures 'npm install' only runs if dependencies actually change.
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on (Standard for Koyeb/Render is often 8000 or 3000)
EXPOSE 8000

# Start the application
CMD ["npm", "start"]