FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Cambiamos npm ci --production por npm install --omit=dev
RUN npm install --omit=dev

COPY . .

EXPOSE 4000

CMD ["node", "src/app.js"]