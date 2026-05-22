#!/bin/bash

# PRODE-U — Automated Production Deployment Script ☁️🚀
# This script guides you through deploying the Cloudflare Workers and the Frontend.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}    PRODE-U — DESPLIEGUE AUTOMÁTICO A CLOUDFLARE ⚽👾  ${NC}"
echo -e "${CYAN}======================================================${NC}"

# Ensure we are in the correct root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# 1. Check Wrangler login
echo -e "\n${BLUE}[1/6] Verificando autenticación en Cloudflare...${NC}"
if ! npx wrangler whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ No parece que hayas iniciado sesión en Wrangler.${NC}"
    echo -e "${BLUE}Por favor, inicia sesión ahora...${NC}"
    npx wrangler login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error al iniciar sesión en Wrangler. Abortando despliegue.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Autenticado en Cloudflare correctamente.${NC}"
fi

# 2. Database Migrations (D1)
echo -e "\n${BLUE}[2/6] Base de Datos (Cloudflare D1)${NC}"
read -p "¿Deseas ejecutar las migraciones del esquema SQL en la base de datos de producción 'prode_u_db'? (s/n): " RUN_MIGRATION
if [[ "$RUN_MIGRATION" =~ ^[sS]$ ]]; then
    echo -e "${YELLOW}Ejecutando schema.sql en D1 (remoto)...${NC}"
    cd workers/api-worker
    npx wrangler d1 execute prode_u_db --remote --file=schema.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migraciones de D1 ejecutadas correctamente.${NC}"
    else
        echo -e "${RED}❌ Error al ejecutar migraciones en D1. Verifica tu conexión o base de datos.${NC}"
        exit 1
    fi
    cd "$SCRIPT_DIR"
else
    echo -e "${YELLOW}Saltando ejecución de migraciones de base de datos.${NC}"
fi

# 3. Cloudflare Secrets
echo -e "\n${BLUE}[3/6] Configuración de Secretos en Cloudflare${NC}"
read -p "¿Deseas configurar/actualizar los secretos JWT_SECRET y API_FOOTBALL_TOKEN ahora? (s/n): " UPDATE_SECRETS
if [[ "$UPDATE_SECRETS" =~ ^[sS]$ ]]; then
    echo -e "${YELLOW}Configurando JWT_SECRET para api-worker...${NC}"
    cd workers/api-worker
    npx wrangler secret put JWT_SECRET
    
    echo -e "${YELLOW}Configurando API_FOOTBALL_TOKEN para sync-worker...${NC}"
    cd ../sync-worker
    npx wrangler secret put API_FOOTBALL_TOKEN
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✓ Secretos configurados correctamente.${NC}"
else
    echo -e "${YELLOW}Saltando configuración de secretos.${NC}"
fi

# 4. Deploy Cloudflare Workers
echo -e "\n${BLUE}[4/6] Desplegando Cloudflare Workers (Backend)...${NC}"

# 4.1 api-worker
echo -e "${YELLOW}→ Desplegando api-worker...${NC}"
cd workers/api-worker
npm install
npm run deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al desplegar api-worker. Despliegue cancelado.${NC}"
    exit 1
fi

# 4.2 data-worker
echo -e "\n${YELLOW}→ Desplegando data-worker...${NC}"
cd ../data-worker
npm install
npm run deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al desplegar data-worker. Despliegue cancelado.${NC}"
    exit 1
fi

# 4.3 sync-worker
echo -e "\n${YELLOW}→ Desplegando sync-worker...${NC}"
cd ../sync-worker
npm install
npm run deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al desplegar sync-worker. Despliegue cancelado.${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ ¡Todos los Workers se han desplegado con éxito!${NC}"

# 5. Build Frontend (React PWA)
echo -e "\n${BLUE}[5/6] Compilando Frontend (React PWA)...${NC}"
cd frontend

# Verify production env variables are set up
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: No se encuentra el archivo frontend/.env.production${NC}"
    echo -e "Por favor, créalo con las variables VITE_API_BASE y VITE_DATA_BASE."
    exit 1
fi

echo -e "${YELLOW}Instalando dependencias de frontend...${NC}"
npm install

echo -e "${YELLOW}Compilando bundle de producción...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al compilar el frontend.${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ Frontend compilado correctamente en la carpeta frontend/dist.${NC}"

# 6. Deploy Frontend to Cloudflare Pages
echo -e "\n${BLUE}[6/6] Desplegando Frontend a Cloudflare Pages...${NC}"
cd frontend
npx wrangler pages deploy dist --project-name=prode-u
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}======================================================${NC}"
    echo -e "${GREEN}   🎉 ¡PRODE-U HA SIDO DESPLEGADO CON ÉXITO EN LA NUBE! 🎉 ${NC}"
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${CYAN}Por favor, abre la URL que wrangler pages te ha proporcionado en tu navegador.${NC}"
else
    echo -e "${RED}❌ Error al desplegar el frontend a Cloudflare Pages.${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"
