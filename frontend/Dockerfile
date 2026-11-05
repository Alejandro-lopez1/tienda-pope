# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Instalar servidor estático
RUN npm install -g serve

# Copiar archivos buildeados del stage anterior
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 5173

# Comando para desarrollo (con Vite)
# Para producción, usar: serve -s dist -l 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
