FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production 2>/dev/null; exit 0

COPY . .

# Seed knowledge base on build
RUN node src/index.js products 2>/dev/null; exit 0

EXPOSE 3000

CMD ["node", "src/api/server.js"]
