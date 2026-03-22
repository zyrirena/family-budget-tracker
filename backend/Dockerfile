FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/prisma ./prisma/
RUN npx prisma generate
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
