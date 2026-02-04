FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx next build

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://longivity-production.up.railway.app

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
