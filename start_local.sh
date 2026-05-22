#!/bin/bash

# start_local.sh
# Un script premium para levantar todo localmente en macOS abriendo pestañas de Terminal dedicadas.

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;35m⚽👾 INICIANDO ENTORNO LOCAL DE PRODE-U 👾⚽\033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

# Directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Función para abrir pestaña en Terminal de macOS y ejecutar comando
run_in_terminal_tab() {
  local dir=$1
  local cmd=$2
  local title=$3
  
  osascript -e "
    tell application \"Terminal\"
      activate
      tell application \"System Events\" to keystroke \"t\" using command down
      delay 0.3
      do script \"cd '$dir' && printf '\\\e]1;%s\\\a\\\e]2;%s\\\a' '$title' '$title' && clear && $cmd\" in window 1
    end tell
  "
}

# 1. Levantar API Worker
echo -e "\033[1;32m🚀 Levantando api-worker (Puerto 8787) en una nueva pestaña...\033[0m"
run_in_terminal_tab "$ROOT_DIR/workers/api-worker" "npx wrangler dev --port 8787" "⚙️ API WORKER"

# 2. Levantar Data Worker
echo -e "\033[1;32m🚀 Levantando data-worker (Puerto 8788) en una nueva pestaña...\033[0m"
run_in_terminal_tab "$ROOT_DIR/workers/data-worker" "npx wrangler dev --port 8788" "🗄️ DATA WORKER"

# 3. Levantar Frontend Client
echo -e "\033[1;32m🚀 Levantando frontend de Vite (Puerto 5173) en una nueva pestaña...\033[0m"
run_in_terminal_tab "$ROOT_DIR/frontend" "npm run dev" "💻 CLIENTE FRONTEND"

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;33m✅ ¡Todo en marcha! Se han abierto 3 pestañas en tu Terminal.\033[0m"
echo -e "🔗 Cliente Web:    \033[1;34mhttp://localhost:5173\033[0m"
echo -e "🔗 API Worker:     \033[1;34mhttp://localhost:8787\033[0m"
echo -e "🔗 Data Worker:    \033[1;34mhttp://localhost:8788\033[0m"
echo -e "\033[1;36m==========================================================\033[0m"
