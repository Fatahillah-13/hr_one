# HR One — HRIS System V.2.0

A centralized Human Resource Information System (HRIS) portal built with Laravel and React. Login once via Keycloak SSO (OpenID Connect) to access all integrated HR applications based on user roles and divisions.

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| **Backend**    | Laravel 12, PHP 8.2+                                |
| **Frontend**   | React 18, Inertia.js 2.0, Tailwind CSS 3            |
| **UI**         | Radix UI, Lucide Icons, Motion 12 (animation)       |
| **Build Tool** | Vite 7                                               |
| **Database**   | MySQL                                                |
| **Auth**       | Laravel Session, Keycloak SSO (OpenID Connect)       |

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
- Centralized login via Keycloak (OpenID Connect) with Laravel Socialite
- Automatic session refresh using Keycloak refresh tokens
- Single logout (front-channel + backchannel logout support)
- Per-user identity mapping via configurable claim/column (e.g. email)

### Admin Settings
- User management (create, edit, delete, import)
- App management (create, edit, delete)
- Role & division overview

## SSO Login Flow (Keycloak)

```
1. User opens /login → redirected to Keycloak
2. Keycloak authenticates the user and redirects back to /auth/callback
3. HR One maps the configured claim (SSO_CLAIM) to a local user column (SSO_COLUMN) and logs them in
4. The Keycloak session is kept fresh via refresh token checks (CheckSsoSession middleware)
5. Logout ends both the Laravel session and the Keycloak session (front-channel + backchannel logout)
```

## Data Models

| Model            | Description                                      |
| ---------------- | ------------------------------------------------ |
| User             | Employees with role, division & login tracking   |
| Role             | User roles (Admin, Member)                       |
| Division         | Organizational divisions (8 seeded)              |
| App              | Integrated HR applications                       |
| Category         | App categories                                   |
| RoleDivisionApp  | Role-division-app permission assignments         |

## Project Structure

```
app/
├── Http/Controllers/       # SsoController, ProfileController, Settings controllers
├── Http/Middleware/         # AdminMiddleware, HandleInertiaRequests
├── Imports/                 # UsersImport (CSV/Excel)
├── Models/                  # Eloquent models
resources/js/
├── Pages/
│   ├── Dashboard.jsx        # Main portal dashboard
│   ├── Auth/                # Login, Register, Password reset
│   ├── Profile/             # Profile editing
│   └── Settings/
│       ├── Settings.jsx     # Admin dashboard
│       ├── UserManagement/  # User CRUD + import
│       └── AppManagement/   # App CRUD
├── Layouts/                 # Authenticated & Guest layouts
└── Components/              # Navbar, Sidebar, AppCards, forms, etc.
routes/
├── web.php                  # Dashboard, profile
├── auth.php                 # Authentication routes (Keycloak SSO)
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

### Keycloak SSO Setup

Configure your Keycloak client credentials in `.env`:

```env
KEYCLOAK_CLIENT_ID=hr_one
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_REDIRECT_URI="${APP_URL}/auth/callback"
KEYCLOAK_BASE_URL=https://your-keycloak-domain.com
KEYCLOAK_REALM=your-realm
SSO_CLAIM=email
SSO_COLUMN=email
```

### Default Credentials

| Email               | Password      | Role  |
| ------------------- | ------------- | ----- |
| admin@example.com   | password123   | Admin |

## License

This project is proprietary software.
