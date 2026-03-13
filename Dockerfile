# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all project files and build
COPY . .
# Firebase vars come from .env.production (committed to repo — public keys).
# VITE_APP_BUILD_NUMBER is passed via --build-arg from cloudbuild.yaml;
# vite.config.ts falls back to .build-number file when it is not set.
ARG VITE_APP_BUILD_NUMBER
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port (Cloud Run expects 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
