# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN ["npm", "run", "build"]
CMD ["node", "./dist/index.js"]
EXPOSE 8080
