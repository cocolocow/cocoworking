FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/

# Build client (Vite → dist/)
RUN pnpm --filter @cocoworking/client build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Server runs with tsx (handles TypeScript + ESM directly)
CMD ["pnpm", "--filter", "@cocoworking/server", "start"]
