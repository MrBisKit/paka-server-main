FROM oven/bun:1

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl

# Copy only deps first for better Docker cache
COPY bun.lock package.json ./
RUN bun install

# Now copy the full app
COPY . .


# Generate Prisma client (after copying schema)
RUN bunx prisma generate

EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]