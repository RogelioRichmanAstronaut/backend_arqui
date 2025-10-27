# 🚀 Backend Arqui

A modern backend application built with **NestJS**, **TypeScript**, and **Prisma ORM** featuring PostgreSQL database with Docker infrastructure.

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
</p>

## 📋 Description

Backend Arqui is a production-ready backend application built with modern technologies and best practices. It features automatic deployment, database management with migrations, and a clean architecture ready for scalable development.

## 🛠️ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn** or **pnpm**
- **Docker** and **Docker Compose**
- **Git**

### 🚀 One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd backend_arqui

# Copy environment variables
cp .env.example .env

# Deploy everything automatically (database + services)
./deploy.sh

# Start the API in development mode
npm run start:dev
```

That's it! 🎉 Your application will be running with:
- **PostgreSQL** at `localhost:5432`
- **pgAdmin** at `http://localhost:8080`
- **Prisma Studio** at `npm run prisma:studio` (database GUI)
- **API** at `http://localhost:3000`

## 📁 Project Structure

```
backend_arqui/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── migrations/        # Database migration files
├── src/
│   ├── prisma/            # Prisma services for NestJS
│   │   ├── prisma.service.ts   # Prisma client service
│   │   └── prisma.module.ts    # Global Prisma module
│   ├── users/             # Example users module
│   ├── app.controller.ts  # Main application controller
│   ├── app.module.ts      # Root application module
│   └── main.ts           # Application entry point
├── docker-compose.yml     # Docker services (PostgreSQL + pgAdmin)
├── deploy.sh             # Automated deployment script
├── .env.example          # Environment variables template
└── README.md
```

## 🗄️ Database

### PostgreSQL Configuration

- **Database**: `backend_arqui`
- **Host**: `localhost:5432`
- **Username**: `postgres`
- **Password**: `postgres`

### pgAdmin Access

- **URL**: `http://localhost:8080`
- **Email**: `admin@admin.com`
- **Password**: `admin`

### Prisma Studio

Prisma Studio is a powerful database GUI built into Prisma:

```bash
npm run prisma:studio
```

- **Access**: Opens in your browser automatically
- **Features**: View, edit, and manage your data visually
- **Real-time**: Changes are reflected immediately
- **Schema-aware**: Understands your database structure

## 🐳 Docker Services

The project includes a complete Docker setup:

```yaml
# PostgreSQL 16 with persistent data
# pgAdmin 4 for database management
# Isolated network for security
```

## 📜 Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:prod         # Production build
npm run build             # Build application

# Database
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio

# Testing
npm run test              # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Test coverage

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format with Prettier

# Deployment
./deploy.sh               # Full automated deployment
./deploy.sh start         # Start containers only
./deploy.sh stop          # Stop containers
./deploy.sh status        # Check container status
./deploy.sh logs          # View container logs
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backend_arqui?schema=public"

# Application
PORT=3000

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## 🔄 Development Workflow

1. **Start services**: `./deploy.sh`
2. **Develop**: `npm run start:dev`
3. **Database changes**: Update `prisma/schema.prisma` then `npm run prisma:migrate`
4. **View data**: `npm run prisma:studio` (opens database GUI in browser)
5. **Test**: `npm run test`
6. **Commit**: `git add . && git commit -m "feat: your feature"`

## 🚀 Deployment

### Development
```bash
./deploy.sh  # One command deployment
```

### Production
```bash
npm run build
npm run start:prod
```

For production deployment, consider:
- Environment-specific `.env` files
- Docker containerization
- Cloud database services
- CI/CD pipelines

## 🏗️ Architecture & Technologies

### Core Technologies

- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework for building efficient and scalable server-side applications
- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM for TypeScript & Node.js
- **[PostgreSQL](https://www.postgresql.org/)** - Advanced open source relational database
- **[Docker](https://www.docker.com/)** - Containerization platform

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **pgAdmin** - PostgreSQL administration and query tool
- **Prisma Studio** - Modern database GUI with visual data management

### Project Features

- ✅ **Type Safety** - Full TypeScript support with strict configuration
- ✅ **Database Migrations** - Automated schema management with Prisma
- ✅ **Dependency Injection** - Clean architecture with NestJS modules
- ✅ **Automated Deployment** - One-command setup with Docker
- ✅ **Development Tools** - Hot reload, debugging, and testing
- ✅ **Production Ready** - Optimized for scalability and performance

## 📚 Learning Resources

### NestJS
- [Official Documentation](https://docs.nestjs.com)
- [NestJS Courses](https://courses.nestjs.com/)
- [NestJS Discord Community](https://discord.gg/G7Qnnhy)

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Examples](https://github.com/prisma/prisma-examples)

### Docker
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow [Conventional Commits](https://conventionalcommits.org/)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 API Documentation

Once the API is running, you can access:

- **Swagger/OpenAPI**: `http://localhost:3000/api` (when implemented)
- **Health Check**: `http://localhost:3000/health` (when implemented)
- **API Version**: `http://localhost:3000/api/v1`

## 🔐 Security

This project implements security best practices:

- Environment variable management
- Database connection security
- CORS configuration (to be implemented)
- Input validation (to be implemented)
- Authentication & Authorization (to be implemented)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The framework that makes building scalable Node.js applications easy
- [Prisma](https://www.prisma.io/) - The ORM that makes database management a breeze
- [PostgreSQL](https://www.postgresql.org/) - The world's most advanced open source database
- [Docker](https://www.docker.com/) - Containerization for consistent development environments

---

**Backend Arqui** - Built with ❤️ for scalable and maintainable backend applications.
