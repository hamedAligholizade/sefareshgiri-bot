FROM node:18-alpine

WORKDIR /usr/src/app

# Install required packages
RUN apk add --no-cache \
    netcat-openbsd \
    dos2unix

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads directory
RUN mkdir -p uploads/images

# Make entrypoint script executable and fix line endings
COPY docker-entrypoint.sh .
RUN dos2unix docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"] 