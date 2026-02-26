FROM oven/bun:1.3.8 AS base
WORKDIR /app

# Define the cache directory for Bun
# (It defaults to ~/.bun/install/cache)
ENV BUN_INSTALL_CACHE_DIR=/root/.bun/install/cache

# Install dependencies
COPY package.json bun.lock ./
RUN --mount=type=cache,target=${BUN_INSTALL_CACHE_DIR} \
    bun install --frozen-lockfile

FROM base AS dev

COPY . .

# expose vite default port
EXPOSE 5173

# run the development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

FROM base AS builder

COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM nginx:alpine AS prod

# Copy built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
