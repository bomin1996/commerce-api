FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/server.js"]
