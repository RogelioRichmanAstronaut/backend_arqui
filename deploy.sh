#!/bin/bash

# Backend Arqui - Database Deployment Script
# This script deploys PostgreSQL and pgAdmin containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create it with the required environment variables."
        exit 1
    fi
}

# Function to start services
start_services() {
    print_info "Starting PostgreSQL and pgAdmin containers..."
    docker-compose up -d
    print_success "Containers started successfully!"
}

# Function to stop services
stop_services() {
    print_info "Stopping PostgreSQL and pgAdmin containers..."
    docker-compose down
    print_success "Containers stopped successfully!"
}

# Function to restart services
restart_services() {
    print_info "Restarting PostgreSQL and pgAdmin containers..."
    docker-compose restart
    print_success "Containers restarted successfully!"
}

# Function to show status
show_status() {
    print_info "Container status:"
    docker-compose ps
}

# Function to show logs
show_logs() {
    if [ -z "$2" ]; then
        print_info "Showing logs for all containers (press Ctrl+C to exit):"
        docker-compose logs -f
    else
        print_info "Showing logs for $2 container (press Ctrl+C to exit):"
        docker-compose logs -f "$2"
    fi
}

# Function to reset database (WARNING: This will delete all data)
reset_database() {
    print_warning "This will delete all data in the database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Resetting database..."
        docker-compose down -v
        docker-compose up -d postgres
        print_success "Database reset complete!"
    else
        print_info "Database reset cancelled."
    fi
}

# Function to initialize database (run migrations)
init_database() {
    print_info "Waiting for PostgreSQL to be ready..."
    sleep 10

    # Check if database exists and has tables
    print_info "Checking database status..."
    if npm run prisma:generate --silent 2>/dev/null; then
        # Try to connect and see if migrations table exists
        if npx prisma db execute --file <(echo "SELECT 1 FROM \"_prisma_migrations\" LIMIT 1;") --schema=prisma/schema.prisma >/dev/null 2>&1; then
            print_info "Database already initialized, generating Prisma client..."
            npm run prisma:generate
            print_success "Database client updated successfully!"
        else
            print_info "Database exists but no migrations found, initializing..."
            init_fresh_database
        fi
    else
        print_info "Database not accessible, initializing from scratch..."
        init_fresh_database
    fi
}

# Function to initialize fresh database
init_fresh_database() {
    print_info "Creating initial migration..."
    npx prisma migrate dev --name init --create-only --yes 2>/dev/null || {
        print_info "Migration already exists, applying it..."
        npx prisma migrate deploy
    }

    print_info "Generating Prisma client..."
    npm run prisma:generate

    print_success "Database initialized successfully!"
}

# Function to deploy everything automatically
deploy() {
    print_info "🚀 Starting Backend Arqui deployment..."

    # Start containers if not running
    if ! docker-compose ps | grep -q "Up"; then
        print_info "Starting containers..."
        docker-compose up -d
        print_success "Containers started!"
    else
        print_info "Containers already running"
    fi

    # Initialize database
    init_database

    print_success "🎉 Backend Arqui deployment completed!"
    echo ""
    print_info "Services available:"
    echo "  📊 PostgreSQL: localhost:5432"
    echo "  🛠️  pgAdmin: http://localhost:8080"
    echo "     Email: admin@admin.com"
    echo "     Password: admin"
    echo ""
    print_info "API will be available at: http://localhost:3000"
}

# Function to show help
show_help() {
    echo "Backend Arqui - Database Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy      Deploy everything automatically (recommended)"
    echo "  start       Start PostgreSQL and pgAdmin containers"
    echo "  stop        Stop PostgreSQL and pgAdmin containers"
    echo "  restart     Restart PostgreSQL and pgAdmin containers"
    echo "  status      Show status of containers"
    echo "  logs        Show logs for all containers"
    echo "  logs db     Show logs for PostgreSQL container"
    echo "  logs admin  Show logs for pgAdmin container"
    echo "  init        Initialize database (run migrations)"
    echo "  reset       Reset database (WARNING: deletes all data)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy         # Deploy everything automatically"
    echo "  $0 start          # Start all services"
    echo "  $0 init           # Initialize database after starting services"
    echo "  $0 logs db        # View PostgreSQL logs"
    echo ""
    echo "Services:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - pgAdmin: http://localhost:8080"
    echo "    Email: admin@admin.com"
    echo "    Password: admin"
}

# Main script logic
main() {
    check_docker
    check_env

    case "${1:-deploy}" in
        deploy)
            deploy
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$@"
            ;;
        init)
            init_database
            ;;
        reset)
            reset_database
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
