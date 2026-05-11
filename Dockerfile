# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.19.0

FROM node:${NODE_VERSION}-alpine

ENV CI=true

WORKDIR /usr/src/app

COPY . .

RUN npm i -g pnpm prisma

RUN pnpm i

RUN pnpx prisma generate

RUN pnpm build

USER node

EXPOSE 3000

CMD ["node", "./build/index.js"]