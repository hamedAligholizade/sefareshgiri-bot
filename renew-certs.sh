#!/bin/bash

# Stop nginx container
docker-compose stop nginx

# Renew certificates
certbot renew --quiet

# Copy new certificates
cp /etc/letsencrypt/live/buyfont.ir/fullchain.pem ssl/
cp /etc/letsencrypt/live/buyfont.ir/privkey.pem ssl/

# Fix permissions
chmod 600 ssl/*.pem

# Restart nginx container
docker-compose up -d nginx
