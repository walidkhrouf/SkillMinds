# Use the official Node.js image (v20 LTS)
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# (Optionnel) Définir la variable d’environnement PORT utilisée par votre app
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
