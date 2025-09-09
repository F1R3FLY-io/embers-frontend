FROM --platform=$BUILDPLATFORM node:24-alpine AS build

RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/embers ./apps/embers
COPY packages/client ./packages/client
RUN --mount=type=secret,id=npmrc,target=/app/.npmrc pnpm install --frozen-lockfile

WORKDIR /app/apps/embers
RUN pnpm run build

FROM nginx:stable-alpine
COPY apps/embers/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/embers/dist /usr/share/nginx/html

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
