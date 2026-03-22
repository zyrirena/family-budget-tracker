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

The file must contain **only** those 13 lines. No extra text, no backticks, no explanations — just the raw Dockerfile instructions.

**Save it, then push:**
```
git add .
git commit -m "fix dockerfile"
git push
