# Usar una imagen de Node oficial
FROM node:18-alpine

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package.json package-lock.json ./

# Instalar las dependencias
RUN npm install
# Instalar explícitamente pdfjs-dist
RUN npm install pdfjs-dist@4.0.269

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto 5173 de Vite
EXPOSE 5173

# Comando para iniciar Vite
CMD ["npm", "run", "dev", "--", "--host"]
