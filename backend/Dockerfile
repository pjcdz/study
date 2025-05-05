# Usar una imagen de Node oficial
FROM node:20-alpine

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package.json package-lock.json ./

# Instalar las dependencias con caché y omitir dev
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto 4000
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["node", "src/app.js"]