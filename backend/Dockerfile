FROM node:18-alpine

# Install OpenSSL — required by Prisma on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/index.js"]
```

Then update your **Start Command** in Railway Settings back to just:
```
npx prisma generate && npx prisma db push && node src/prisma/seed.js && node src/index.js
```

Then save the Dockerfile and push to GitHub:
```
git add .
git commit -m "fix openssl for prisma on alpine"
git push
