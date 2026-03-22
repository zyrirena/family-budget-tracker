FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# We specify the schema path here
RUN npx prisma generate --schema=./prisma/schema.prisma
EXPOSE 3001

CMD ["node", "src/index.js"]
