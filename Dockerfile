FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies (only production for smaller image)
RUN npm ci --only=production

# Bundle app source
COPY . .

# Expose port (Cloud Run sets the PORT env variable)
EXPOSE 4000

# Start the server
CMD [ "npm", "start" ]
