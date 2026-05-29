FROM node:20-alpine AS build
WORKDIR /app

# Install dev deps for build
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --production

# Copy built artifacts
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/index.js"]
