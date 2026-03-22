FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
```

The key changes are:
- `node:18` instead of `node:18-alpine` — this is the full version of Node that already has OpenSSL built in, no extra install needed
- `COPY prisma ./prisma/` before `prisma generate` — makes sure the schema file is there before Prisma tries to read it

**Save it, push to GitHub:**
```
git add .
git commit -m "switch to full node image"
git push
```

**And double check your Railway Settings → Start Command is set to:**
```
npx prisma generate && npx prisma db push && node src/prisma/seed.js && node src/index.js
