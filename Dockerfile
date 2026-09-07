# Construir backend
FROM node:20-alpine AS backend
WORKDIR /app
COPY CONVEN_Desktop/package*.json ./
RUN npm install
COPY CONVEN_Desktop ./
RUN npx tsc

# Imagen final
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=backend /app/package*.json ./
RUN npm install --omit=dev

COPY --from=backend /app/backend_dist ./backend_dist
COPY --from=backend /app/prisma ./prisma
# Aqui copiamos el public pre-construido directamente desde CONVEN_Desktop
COPY --from=backend /app/public ./public

RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "backend_dist/index.js"]
