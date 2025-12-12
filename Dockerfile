FROM node:20-bullseye-slim AS builder

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y python3 g++ make && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

RUN npm prune --production

FROM node:20-bullseye-slim AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]