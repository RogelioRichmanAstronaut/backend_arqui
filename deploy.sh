#!/usr/bin/env bash
set -euo pipefail

# ========= Config =========
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DB_IMAGE="${DB_IMAGE:-postgres:16-alpine}"
DB_CONTAINER="${DB_CONTAINER:-turismo-postgres}"
DB_NAME="${DB_NAME:-turismo_db}"
DB_USER="${DB_USER:-turismo_user}"
DB_PASSWORD="${DB_PASSWORD:-turismo_pass}"
DB_PORT="${DB_PORT:-5432}"

ENV_FILE="${ROOT_DIR}/.env"

# ========= Funciones =========
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
  local try_ports=("$DB_PORT" 5433 5434 5435 5436)
  for p in "${try_ports[@]}"; do
    if ! port_in_use "$p"; then
      echo "$p"
      return 0
    fi
  done
  echo "No hay puertos libres en 5432-5436" >&2
  exit 1
}

docker_must_be_ready() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker no está instalado o no está en PATH." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Docker no está disponible (¿está iniciado?)." >&2
    exit 1
  fi
}

ensure_container() {
  local name="$1"
  if docker ps -q -f "name=^/${name}$" >/dev/null | grep -q .; then
    echo "✔ Contenedor ${name} ya está corriendo."
    return 0
  fi

  if docker ps -aq -f "name=^/${name}$" >/dev/null | grep -q .; then
    echo "⚙️  Iniciando contenedor existente ${name}..."
    docker start "$name" >/dev/null
  else
    echo "🚀 Creando contenedor ${name}..."
    docker run -d \
      --name "$name" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -e POSTGRES_DB="$DB_NAME" \
      -p "${DB_PORT}:5432" \
      -v "${name}-data":/var/lib/postgresql/data \
      "$DB_IMAGE" >/dev/null
  fi
}

wait_for_postgres() {
  local name="$1"
  echo -n "⏳ Esperando a Postgres en el contenedor ${name} "
  # usar pg_isready dentro del contenedor
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
  local url="$1"
  if [ -f "$ENV_FILE" ]; then
    if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
      echo "✏️  Actualizando DATABASE_URL en .env"
      # macOS: sed necesita extensión de backup
      sed -i.bak -E "s#^DATABASE_URL=.*#DATABASE_URL=${url}#g" "$ENV_FILE"
    else
      echo "➕ Agregando DATABASE_URL a .env"
      printf "\nDATABASE_URL=%s\n" "$url" >> "$ENV_FILE"
    fi
  else
    echo "🆕 Creando .env con PORT y DATABASE_URL"
    cat > "$ENV_FILE" <<EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=${url}
EOF
  fi
}

print_usage() {
  cat <<EOF
Uso:
  ./deploy.sh                 # Crea/inicia Postgres y escribe .env (DATABASE_URL)
  ./deploy.sh migrate <name>  # Genera Prisma y aplica migrate dev con nombre <name>
  ./deploy.sh status          # Muestra estado del contenedor
  ./deploy.sh down            # Elimina contenedor (no borra volumen)
Variables opcionales (export antes de ejecutar):
  DB_IMAGE, DB_CONTAINER, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
EOF
}

# ========= Main =========
CMD="${1:-}"

docker_must_be_ready

# Resolver puerto libre
DB_PORT="$(find_free_port)"

# Asegurar contenedor
ensure_container "$DB_CONTAINER"

# Esperar readiness
wait_for_postgres "$DB_CONTAINER"

# Construir DATABASE_URL y escribir/actualizar .env
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
write_env "$DATABASE_URL"

echo "✅ DATABASE_URL listo:"
echo "    ${DATABASE_URL}"
echo "📄 .env ubicado en: ${ENV_FILE}"

case "$CMD" in
  migrate)
    NAME="${2:-init}"
    echo "🧭 Prisma generate..."
    npx prisma generate
    echo "🧭 Prisma migrate dev -n \"${NAME}\"..."
    npx prisma migrate dev -n "${NAME}"
    ;;
  status)
    docker ps -a --filter "name=^/${DB_CONTAINER}$"
    ;;
  down)
    echo "🗑️  Eliminando contenedor ${DB_CONTAINER} (volumen permanece)..."
    docker rm -f "${DB_CONTAINER}" || true
    ;;
  "")
    ;;
  *)
    print_usage
    ;;
esac