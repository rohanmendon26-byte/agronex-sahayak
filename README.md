# AgroNex Sahayak

> A secure community assistance platform connecting senior citizens with verified volunteers under police administration.

<p align="center">
  <img src="https://img.shields.io/badge/status-Evaluation%202-1f6feb?style=for-the-badge" alt="Project status: Evaluation 2">
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 22">
  <img src="https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas">
</p>

## Overview

AgroNex Sahayak helps senior citizens request assistance and enables verified volunteers to respond through a controlled, auditable workflow. Police administrators manage volunteer verification, assignments, emergency records, and audit activity from a central system.

The repository contains both sides of the application:

- **Backend:** Express REST API with JWT authentication, role-based authorization, and MongoDB persistence.
- **Frontend:** Next.js application with role-specific experiences for seniors, volunteers, and administrators.

### Core roles

| Role | Responsibility |
| --- | --- |
| **Senior Citizen** | Create and track assistance requests. |
| **Volunteer** | Register, receive assignments, and update request status. |
| **Police Admin** | Verify volunteers, assign requests, manage emergencies, and review audit logs. |

## Features

- Volunteer registration, authentication, verification, and activation
- Admin authentication with JWT access tokens
- Role-based route protection
- Assistance request creation, retrieval, assignment, and status updates
- Emergency record creation
- Audit logging for important administrative actions
- MongoDB data models for users, profiles, organisations, requests, emergencies, and audit logs
- Next.js frontend views for admin, senior, and volunteer workflows

## Architecture

```text
                         Next.js Frontend
                    (Admin / Senior / Volunteer)
                                  |
                                  v
                           Express REST API
                                  |
              +-------------------+-------------------+
              |                                       |
              v                                       v
      JWT Authentication                      Role Authorization
              |                                       |
              +-------------------+-------------------+
                                  |
                                  v
                         Controllers and Services
                                  |
                                  v
                            Mongoose Models
                                  |
                                  v
                             MongoDB Atlas
```

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Node.js 22, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Security | JWT, bcryptjs, dotenv |
| Development | Nodemon, ESLint |

## Repository Structure

```text
agronex-sahayak-backend/
├── backend/
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication and role checks
│   ├── models/             # Mongoose schemas
│   ├── routes/             # REST API routes
│   ├── scripts/            # Setup scripts
│   ├── services/           # Shared business services
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── senior/
│   │   └── volunteer/
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 22.x or later
- npm
- A MongoDB Atlas cluster or local MongoDB instance

### 1. Clone the repository

```bash
git clone https://github.com/rohanmendon26-byte/agronex-sahayak-backend.git
cd agronex-sahayak-backend
```

### 2. Configure the backend

```bash
cd backend
npm install
copy .env.example .env
```

Open `backend/.env` and set your values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Start the API in development mode:

```bash
npm run dev
```

The backend is available at `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:3000`.

> Never commit `.env`, `.env.local`, database credentials, or JWT secrets. Use the included environment example files as templates.

## API Reference

All protected endpoints require:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/auth/volunteer/register` | Public |
| `POST` | `/api/auth/volunteer/login` | Public |
| `POST` | `/api/auth/admin/login` | Public |

### Volunteers

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/volunteers` | Police Admin |
| `PATCH` | `/api/volunteers/:id/verify` | Police Admin |
| `PATCH` | `/api/volunteers/:id/activate` | Police Admin |

### Assistance Requests

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/requests` | Senior / Police Admin |
| `GET` | `/api/requests` | Senior / Volunteer / Police Admin |
| `PATCH` | `/api/requests/:id/assign` | Police Admin |
| `PATCH` | `/api/requests/:id/status` | Volunteer / Police Admin |

### Emergency and audit records

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/emergencies` | Police Admin |
| `GET` | `/api/audit-logs` | Police Admin |

## Security Model

1. Users authenticate through the appropriate login endpoint.
2. The API issues a JWT containing the authenticated identity and role.
3. Middleware validates the token on protected routes.
4. Role middleware confirms that the user can perform the requested action.
5. Important administrative activity is recorded in the audit log.

## Development Commands

### Backend

```bash
cd backend
npm run dev       # Start with Nodemon
npm start         # Start with Node.js
```

### Frontend

```bash
cd frontend
npm run dev       # Start the Next.js development server
npm run build     # Create a production build
npm start         # Serve the production build
npm run lint      # Run ESLint
```

## Demonstration

The Evaluation 2 demonstration covers the main workflow:

```text
Volunteer Registration
        -> Volunteer Login
        -> Admin Login
        -> Volunteer Verification
        -> Volunteer Activation
        -> Assistance Request
        -> Volunteer Assignment
        -> Request Status Update
        -> Emergency Record
        -> Audit Log
```

**Video:** [Watch the Evaluation 2 Backend Demonstration](https://youtu.be/fq3BohuEsoA)

## Project Status

**Current milestone:** Round 1 - Evaluation 2
**Current focus:** Core backend workflow and frontend integration
**Next milestone:** Round 2 - Expanded backend functionality, validation, testing, and production hardening

Planned improvements include richer profile management, extended emergency handling, stronger request state validation, automated testing, and additional security hardening.

## Team

AgroNex Sahayak is developed as part of **HPL 2026**.

---

> **AgroNex Sahayak** - Technology for safer, more connected community assistance.
