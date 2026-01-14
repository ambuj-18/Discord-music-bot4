FROM node:20-alpine AS builder

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY --from=builder /app /app

CMD ["node", "index.js"]
