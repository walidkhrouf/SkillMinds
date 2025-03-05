# Use the official Node.js image.
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if present).
COPY package*.json ./

# Install dependencies
RUN npm ci 

# Copy the rest of the application code.
COPY . .

# Expose the application port.
EXPOSE 5000

# Start the application with npm start.
CMD ["npm", "start"]