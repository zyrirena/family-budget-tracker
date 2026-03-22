FROM node:18-alpine

# 1. Install OpenSSL (Prisma needs this to run on Alpine Linux)
RUN apk add --no-cache openssl

WORKDIR /app

# 2. Copy dependency files
COPY package*.json ./

# 3. Install dependencies
RUN npm install

# 4. Copy the rest of your code
COPY . .

# 5. Generate Prisma Client
# Note: If this fails, make sure the file is actually at 'src/prisma/schema.prisma' 
# based on your Step 15 instructions.
RUN npx prisma generate --schema=./src/prisma/schema.prisma

EXPOSE 3001

CMD ["node", "src/index.js"]
