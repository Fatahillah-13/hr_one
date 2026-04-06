# HR One — HRIS System V.2.0

A centralized Human Resource Information System (HRIS) portal built with Laravel and React. Login once to access all integrated HR applications based on user roles and divisions.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.2+
- **Frontend:** React 18, Inertia.js 2.0, Tailwind CSS
- **UI Components:** Radix UI, Lucide Icons, Motion (animation)
- **Build Tool:** Vite 7
- **Database:** MySQL

## Features

- Single sign-on portal for all HR applications
- Role & division-based access control
- App categorization and management
- User management with active/inactive status
- Recent apps tracking per user

## Data Models

| Model              | Description                              |
| ------------------ | ---------------------------------------- |
| User               | Employees with role & division           |
| Role               | User roles (e.g. Admin, Staff)           |
| Division           | Organizational divisions                 |
| App                | Integrated HR applications               |
| Category           | App categories                           |
| RoleDivisionApp    | Role-division permission assignments     |

## Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL

### Installation

```bash
# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Copy environment file and configure database
cp .env.example .env
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Start development servers
php artisan serve
npm run dev
```

## License

This project is proprietary software.
