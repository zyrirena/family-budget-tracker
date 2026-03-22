FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/prisma ./src/prisma/
RUN npx prisma generate --schema=./src/prisma/schema.prisma
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
