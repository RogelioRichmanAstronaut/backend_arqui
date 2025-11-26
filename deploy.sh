#!/usr/bin/env bash
set -euo pipefail

# ======================= Configuración General =======================
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Database Config ---
DB_IMAGE="${DB_IMAGE:-postgres:16-alpine}"
DB_CONTAINER="${DB_CONTAINER:-turismo-postgres}"
DB_NAME="${DB_NAME:-turismo_db}"
DB_USER="${DB_USER:-turismo_user}"
DB_PASSWORD="${DB_PASSWORD:-turismo_pass}"
DB_PORT_DEFAULT="${DB_PORT:-5432}" # Default desired port, but find_free_port will resolve actual port
DB_PORT_ACTUAL="" # Actual port resolved at runtime

# --- Application Config ---
APP_NAME="${APP_NAME:-nestjs-turismo}"
APP_PORT="${APP_PORT:-3000}" # NestJS Port
APP_ENTRY="${APP_ENTRY:-./dist/main.js}" # Path to the compiled entry file

ENV_FILE="${ROOT_DIR}/.env"

# =========================== Funciones ===========================

port_in_use() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z localhost "$port" >/dev/null 2>&1
  else
    # Fallback si nc no está: intentar conectar con bash/tcp
    (exec 3<>/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1 || return 1
    exec 3>&-
  fi
}

find_free_port() {
  local start_port="$1"
  local try_ports=("$start_port" 5433 5434 5435 5436)
  for p in "${try_ports[@]}"; do
    if ! port_in_use "$p"; then
      echo "$p"
      return 0
    fi
  done
  echo "No hay puertos libres en el rango ${start_port}-5436" >&2
  exit 1
}

docker_must_be_ready() {
  echo -n "⚙️  Verificando Docker... "
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker no está instalado o no está en PATH." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Docker no está disponible (¿está iniciado?)." >&2
    exit 1
  fi
  echo "Listo."
}

app_prerequisites_must_be_ready() {
  echo -n "⚙️  Verificando Node.js y PM2... "
  if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js no está instalado." >&2
    exit 1
  fi
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "ERROR: PM2 no está instalado globalmente (npm install -g pm2)." >&2
    exit 1
  fi
  echo "Listo."
}

ensure_container() {
  local name="$1"
  local db_port="$2"
  
  if docker ps -q -f "name=^/${name}$" >/dev/null | grep -q .; then
    echo "✔ Contenedor ${name} ya está corriendo."
    return 0
  fi

  if docker ps -aq -f "name=^/${name}$" >/dev/null | grep -q .; then
    echo "⚙️  Iniciando contenedor existente ${name}..."
    docker start "$name" >/dev/null
  else
    echo "🚀 Creando contenedor ${name} en puerto ${db_port}..."
    docker run -d \
      --name "$name" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -e POSTGRES_DB="$DB_NAME" \
      -p "${db_port}:5432" \
      -v "${name}-data":/var/lib/postgresql/data \
      "$DB_IMAGE" >/dev/null
  fi
}

wait_for_postgres() {
  local name="$1"
  echo -n "⏳ Esperando a Postgres en el contenedor ${name} "
  for i in {1..60}; do
    if docker exec "$name" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
      echo "→ listo."
      return 0
    fi
    echo -n "."
    sleep 1
  done
  echo
  echo "Postgres no respondió a tiempo." >&2
  exit 1
}

write_env() {
  local db_url="$1"
  local app_port="$2"
  
  # Ensure the .env file exists
  if [ ! -f "$ENV_FILE" ]; then
    echo "🆕 Creando .env con valores iniciales."
    touch "$ENV_FILE"
  fi

  # Helper function to update or append a key=value pair
  update_env_key() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" "$ENV_FILE"; then
      echo "✏️  Actualizando ${key} en .env"
      # Use a safe sed command (works on both Linux and macOS with .bak backup)
      sed -i.bak -E "s#^${key}=.*#${key}=${value}#g" "$ENV_FILE"
      rm -f "${ENV_FILE}.bak"
    else
      echo "➕ Agregando ${key} a .env"
      printf "\n%s=%s\n" "$key" "$value" >> "$ENV_FILE"
    fi
  }

  update_env_key "PORT" "$app_port"
  update_env_key "NODE_ENV" "production" # Recommended for deployment
  update_env_key "DATABASE_URL" "$db_url"
  
  echo "📄 .env actualizado con éxito en: ${ENV_FILE}"
}

print_usage() {
  cat <<EOF
Uso:
  ./deploy.sh                 # [DEFAULT] Realiza el despliegue completo (DB, Build, PM2 Start)
  ./deploy.sh migrate <name>  # Genera Prisma y aplica migrate dev con nombre <name>
  ./deploy.sh status          # Muestra estado del contenedor
  ./deploy.sh down            # Elimina contenedor (no borra volumen)
Variables opcionales (export antes de ejecutar):
  DB_IMAGE, DB_CONTAINER, DB_NAME, DB_USER, DB_PASSWORD, APP_PORT, etc.
EOF
}

# =========================== Main Execution ===========================
CMD="${1:-}"

# --- Global checks and DB setup (runs for all commands except 'down') ---
if [ "$CMD" != "down" ]; then
    docker_must_be_ready

    # Resolver puerto libre para la DB
    DB_PORT_ACTUAL="$(find_free_port "$DB_PORT_DEFAULT")"
    if [ "$DB_PORT_ACTUAL" != "$DB_PORT_DEFAULT" ]; then
        echo "⚠️ Puerto ${DB_PORT_DEFAULT} ocupado. Usando puerto ${DB_PORT_ACTUAL} para la DB."
    fi

    # Asegurar contenedor de la DB
    ensure_container "$DB_CONTAINER" "$DB_PORT_ACTUAL"

    # Esperar readiness de la DB
    wait_for_postgres "$DB_CONTAINER"

    # Construir DATABASE_URL y escribir/actualizar .env
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT_ACTUAL}/${DB_NAME}?schema=public"
    write_env "$DATABASE_URL" "$APP_PORT"
    
    echo "✅ DATABASE_URL listo: ${DATABASE_URL}"
fi

case "$CMD" in
  migrate)
    NAME="${2:-init}"
    echo "🧭 Prisma generate..."
    npx prisma generate
    echo "🧭 Prisma migrate dev -n \"${NAME}\"..."
    npx prisma migrate dev -n "${NAME}"
    ;;

  status)
    echo "--- Estado del Contenedor DB ---"
    docker ps -a --filter "name=^/${DB_CONTAINER}$"
    echo "--- Estado de la Aplicación (PM2) ---"
    pm2 list || echo "PM2 no está corriendo o la app no ha sido desplegada."
    ;;

  down)
    echo "🗑️  Eliminando contenedor ${DB_CONTAINER} (volumen permanece)..."
    docker rm -f "${DB_CONTAINER}" || true
    ;;

  "")
    # --- DESPLIEGUE COMPLETO DE LA APLICACIÓN ---
    echo "--- Despliegue de Aplicación NestJS ---"
    app_prerequisites_must_be_ready

    echo "--- 4. Instalar dependencias de producción y construir ---"
    # Instalar dependencias
    npm ci --only=production
    # Compilar TypeScript (ejecuta el script 'build' en package.json)
    npm run build

    if [ $? -ne 0 ]; then
        echo "ERROR: La construcción de NestJS falló. Verifique 'npm run build'."
        exit 1
    fi

    echo "--- 5. Iniciar/Reiniciar la aplicación con PM2 ---"
    # Eliminar cualquier proceso PM2 anterior
    pm2 delete $APP_NAME 2> /dev/null

    # Iniciar la aplicación. Se asume que la app lee el PORT del .env.
    pm2 start $APP_ENTRY --name $APP_NAME --interpreter node -- start
    
    # Guardar la lista de procesos para que se reinicie al iniciar el sistema
    pm2 save

    echo "--- Despliegue NestJS Completo ---"
    echo "Aplicación '$APP_NAME' corriendo en puerto ${APP_PORT} (Host)."
    echo "Revisar logs: pm2 logs $APP_NAME"
    echo "Acceso: http://<IP_del_Servidor>:${APP_PORT}"
    ;;

  *)
    print_usage
    ;;
esac