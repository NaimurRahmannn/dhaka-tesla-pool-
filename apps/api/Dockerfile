FROM node:20.19-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

FROM deps AS builder

WORKDIR /app

ENV DATABASE_URL=postgresql://tesla_pool:change_me@db:5432/tesla_pool

COPY . .

RUN npm run db:generate --workspace=@dhaka-tesla-pool/api
RUN npm run build --workspace=@dhaka-tesla-pool/api

FROM node:20.19-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
