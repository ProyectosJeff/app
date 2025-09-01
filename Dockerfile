# Imagen ligera de Node
FROM node:18-alpine

# Carpeta de trabajo
WORKDIR /app

# Copiamos solo package*.json del backend para aprovechar caché
COPY backend/package*.json ./backend/

# Instalamos dependencias del backend
RUN cd backend && npm ci --omit=dev

# Copiamos el código del backend
COPY backend ./backend

# Vars por defecto (Railway sobreescribe PORT con su valor)
ENV PORT=4000

# Exponemos el puerto
EXPOSE 4000

# Arrancamos el backend
CMD ["npm","start","--prefix","backend"]
