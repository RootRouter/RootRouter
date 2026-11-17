FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/proxy/package.json packages/proxy/
COPY packages/sdk/package.json packages/sdk/
RUN npm ci --omit=dev --workspace @rootrouter/proxy --include-workspace-root=false 2>/dev/null || npm install --omit=dev -w @rootrouter/proxy
COPY packages/sdk packages/sdk
COPY packages/proxy packages/proxy
RUN npm run build -w rootrouter && npm run build -w @rootrouter/proxy
ENV PORT=8787
EXPOSE 8787
CMD ["node", "packages/proxy/dist/server.js"]