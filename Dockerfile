FROM node:18-alpine

WORKDIR /usr/src/app

# Install netcat for database connection checking
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads directory
RUN mkdir -p uploads/images

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["./docker-entrypoint.sh"] 