# This file will have instructions for docker to create the containers

# Stage-1: Build
FROM node:22.9.0-alpine@sha256:c9bb43423a6229aeddf3d16ae6aaa0ff71a0b2951ce18ec8fedb6f5d766cf286 AS build

LABEL maintainer="Adnan Mohammed <amohammed109@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV PORT=8080 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false


# Use /app as our working directory
WORKDIR /app

# Option 2: relative path - Copy the package.json and package-lock.json
# files into the working dir (/app).  NOTE: this requires that we have
# already set our WORKDIR in a previous step.
COPY package*.json ./

# Install only production dependencies
RUN npm ci

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

#Stage-2: Deploy
FROM node:22.9.0-alpine@sha256:c9bb43423a6229aeddf3d16ae6aaa0ff71a0b2951ce18ec8fedb6f5d766cf286 AS run

WORKDIR /app

# Copy built application and dependencies from builder stage
COPY --from=build /app /app

# Start the container by running our server
CMD ["npm", "start"]

# We run our service on port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:${PORT}/ || exit 1
