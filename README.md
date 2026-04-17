# HR One — HRIS System V.2.0

A centralized Human Resource Information System (HRIS) portal built with Laravel and React. Login once to access all integrated HR applications based on user roles and divisions through a secure SSO (Single Sign-On) flow using RS256 JWT tokens.

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| **Backend**    | Laravel 12, PHP 8.2+                                |
| **Frontend**   | React 18, Inertia.js 2.0, Tailwind CSS 3            |
| **UI**         | Radix UI, Lucide Icons, Motion 12 (animation)       |
| **Build Tool** | Vite 7                                               |
| **Database**   | MySQL                                                |
| **Auth**       | Laravel Sanctum, RS256 JWT (SSO)                     |

## Features

### Portal & Dashboard
- Multi-app portal — central login for multiple HR applications
- Division-based app listing on the dashboard
- App categorization and search

### User & Access Management
- Role-based access control (Admin / Member)
- Division assignment per user (HRD, Payroll, IT, Recruitment, etc.)
- User CRUD with active/inactive status and last-login tracking
- Bulk user import via CSV/Excel template

### Single Sign-On (SSO)
- RS256 JWT-based SSO handoff to integrated apps
- Secure code/state exchange flow with expiration
- Per-app SSO configuration (client ID, secret, redirect URI)
- Public/private key pair configuration

### Admin Settings
- User management (create, edit, delete, import)
- App management (create, edit, delete, SSO config)
- Role & division overview

## SSO Integration Flow

```
1. User clicks an app on the dashboard
2. HR One creates a SsoLoginHandoff (code + state) and redirects to the app
3. The target app calls POST /api/sso/exchange with client credentials + code + state
4. HR One validates credentials, verifies the handoff, and returns a signed JWT
5. The target app verifies the JWT with the public key and establishes a session
```

See [`docs/laravel-sso-consumer-example.md`](docs/laravel-sso-consumer-example.md) for a full integration guide.

## Data Models

| Model            | Description                                      |
| ---------------- | ------------------------------------------------ |
| User             | Employees with role, division & login tracking   |
| Role             | User roles (Admin, Member)                       |
| Division         | Organizational divisions (8 seeded)              |
| App              | Integrated HR applications with SSO config       |
| Category         | App categories                                   |
| RoleDivisionApp  | Role-division-app permission assignments         |
| SsoLoginHandoff  | Temporary SSO handoff tokens (code/state/expiry) |

## Project Structure

```
app/
├── Http/Controllers/       # SsoController, ProfileController, Settings controllers
├── Http/Middleware/         # AdminMiddleware, HandleInertiaRequests
├── Imports/                 # UsersImport (CSV/Excel)
├── Models/                  # Eloquent models
├── Services/                # SsoJwtService, SsoLoginService
resources/js/
├── Pages/
│   ├── Dashboard.jsx        # Main portal dashboard
│   ├── Auth/                # Login, Register, Password reset
│   ├── Profile/             # Profile editing
│   └── Settings/
│       ├── Settings.jsx     # Admin dashboard
│       ├── UserManagement/  # User CRUD + import
│       └── AppManagement/   # App CRUD + SSO config
├── Layouts/                 # Authenticated & Guest layouts
└── Components/              # Navbar, Sidebar, AppCards, forms, etc.
routes/
├── web.php                  # Dashboard, SSO launch, profile
├── api.php                  # SSO token exchange endpoint
├── auth.php                 # Authentication routes
└── settings.php             # Admin settings (users, apps)
```

## Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL

### Installation

```bash
# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Start development servers
php artisan serve
npm run dev
```

### SSO Key Setup

Generate an RSA key pair for JWT signing:

```bash
openssl genrsa -out storage/keys/private.pem 2048
openssl rsa -in storage/keys/private.pem -pubout -out storage/keys/public.pem
```

Add to `.env`:

```env
SSO_PRIVATE_KEY_PATH=storage/keys/private.pem
SSO_PUBLIC_KEY_PATH=storage/keys/public.pem
SSO_ISSUER=https://your-hr-one-domain.com
SSO_CODE_TTL=60
SSO_JWT_TTL=300
```

### Default Credentials

| Email               | Password      | Role  |
| ------------------- | ------------- | ----- |
| admin@example.com   | password123   | Admin |

## License

This project is proprietary software.
