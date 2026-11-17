# SDD slice G — multi-stage proxy image
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/sdk/package.json packages/sdk/
COPY packages/proxy/package.json packages/proxy/
COPY packages/mcp/package.json packages/mcp/
RUN npm ci
COPY packages/sdk packages/sdk
COPY packages/proxy packages/proxy
RUN npm run build -w rootrouter && npm run build -w @rootrouter/proxy

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8787
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/sdk/package.json packages/sdk/
COPY --from=build /app/packages/sdk/dist packages/sdk/dist
COPY --from=build /app/packages/proxy/package.json packages/proxy/
COPY --from=build /app/packages/proxy/dist packages/proxy/dist
WORKDIR /app/packages/proxy
EXPOSE 8787
CMD ["node", "dist/server.js"]