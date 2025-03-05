# Use the official Node.js image.
FROM node:20 AS build

# Set the working directory.
WORKDIR /src

# Copy package.json and package-lock.json (if present).
COPY package*.json ./

# Install dependencies.
RUN npm install --silent

# Copy the rest of the application code.
COPY . .

# Build the React application using Vite.
RUN npm run build

# Use a lightweight web server to serve the static files.
FROM nginx:alpine

# Remove the default Nginx configuration.
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration file.
COPY nginx.conf /etc/nginx/conf.d

# Copy built files from the build stage to the nginx server.
COPY --from=build /src/dist /usr/share/nginx/html 

# Expose the port that Nginx is running on.
EXPOSE 80

# Start Nginx when the container runs.
CMD ["nginx", "-g", "daemon off;"]