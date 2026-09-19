# AgroNex Sahayak — Backend

> A backend platform for community assistance, connecting senior citizens with verified volunteers under police administration.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas)
[![JWT](https://img.shields.io/badge/Auth-JWT-blue)](https://jwt.io/)

---

## 📌 Project Overview

**AgroNex Sahayak** is a community assistance platform designed to facilitate assistance requests from senior citizens and connect them with verified and active volunteers.

The backend provides:

* Secure authentication
* Role-based access control
* Volunteer registration and verification
* Assistance request management
* Volunteer assignment
* Emergency record creation
* Audit logging
* MongoDB-based data persistence

The system is designed around three primary roles:

* **Senior Citizen**
* **Volunteer**
* **Police Admin**

---

## 🎯 Evaluation 2 Scope

This repository contains the backend implementation developed for **HPL 2026 — Round 1 Evaluation 2**.

The current implementation focuses on the core backend functionality required for the Evaluation 2 milestone.

### Implemented

* Volunteer registration
* Volunteer login
* Police Admin login
* JWT-based authentication
* Role-based authorization
* Volunteer verification
* Volunteer activation
* Assistance request creation
* Assistance request retrieval
* Volunteer assignment
* Request status management
* Emergency record creation
* Audit logging
* MongoDB/Mongoose data models

### Planned for Round 2

The remaining backend functionality will be completed and refined during the next implementation stage, including additional profile management, extended emergency handling, stronger validation, automated testing, and further backend hardening.

---

## 🏗️ System Architecture

```text
                    Client / API Consumer
                            │
                            ▼
                    Express REST API
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      JWT Authentication             Role-Based Access
             │                             │
             └──────────────┬──────────────┘
                            ▼
                       Controllers
                            │
                            ▼
                         Models
                            │
                            ▼
                    MongoDB / Mongoose
```

The backend follows a modular structure separating routes, controllers, middleware, models, services, and configuration.

---

## 🛠️ Technology Stack

| Technology    | Purpose                       |
| ------------- | ----------------------------- |
| Node.js       | JavaScript runtime            |
| Express.js    | REST API framework            |
| MongoDB Atlas | Database                      |
| Mongoose      | MongoDB object modeling       |
| JWT           | Authentication                |
| bcryptjs      | Password hashing              |
| CORS          | Cross-origin request handling |
| dotenv        | Environment configuration     |
| Nodemon       | Development server            |

---

## 📁 Project Structure

```text
agronex-sahayak-backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── auditController.js
│   ├── authController.js
│   ├── emergencyController.js
│   ├── requestController.js
│   └── volunteerController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│
├── models/
│   ├── AssistanceRequest.js
│   ├── AuditLog.js
│   ├── EmergencyRecord.js
│   ├── Organisation.js
│   ├── SeniorProfile.js
│   ├── User.js
│   └── VolunteerProfile.js
│
├── routes/
│   ├── auditRoutes.js
│   ├── authRoutes.js
│   ├── emergencyRoutes.js
│   ├── requestRoutes.js
│   └── volunteerRoutes.js
│
├── scripts/
│   ├── createAdmin.js
│   └── createSenior.js
│
├── services/
│   └── auditService.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

---

## 🔐 Authentication & Authorization

The backend uses **JWT-based authentication**.

After successful login, the server issues a JWT containing the authenticated user's identity and role.

Protected routes use:

```text
Authorization: Bearer <JWT_TOKEN>
```

Role-based middleware restricts access according to the user's role.

### Role Access

| Functionality             | Senior | Volunteer | Police Admin |
| ------------------------- | :----: | :-------: | :----------: |
| Volunteer Registration    |    —   |     ✓     |       —      |
| Volunteer Login           |    —   |     ✓     |       —      |
| Admin Login               |    —   |     —     |       ✓      |
| View Volunteers           |    —   |     —     |       ✓      |
| Verify Volunteer          |    —   |     —     |       ✓      |
| Activate Volunteer        |    —   |     —     |       ✓      |
| Create Assistance Request |    ✓   |     —     |       ✓      |
| View Requests             |    ✓   |     ✓     |       ✓      |
| Assign Volunteer          |    —   |     —     |       ✓      |
| Update Request Status     |    —   |     ✓     |       ✓      |
| Create Emergency Record   |    —   |     —     |       ✓      |
| View Audit Logs           |    —   |     —     |       ✓      |

---

## 🗄️ Database Architecture

The backend uses MongoDB with Mongoose models.

### Collections / Models

```text
User
   │
   ├── SeniorProfile
   │
   └── VolunteerProfile
          │
          └── Organisation

AssistanceRequest
   │
   ├── User (Senior)
   └── User (Volunteer)

EmergencyRecord
   │
   └── AssistanceRequest

AuditLog
   ├── User
   └── AssistanceRequest
```

### Core Data Models

* `User`
* `SeniorProfile`
* `VolunteerProfile`
* `Organisation`
* `AssistanceRequest`
* `EmergencyRecord`
* `AuditLog`

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                       | Access |
| ------ | ------------------------------ | ------ |
| `POST` | `/api/auth/volunteer/register` | Public |
| `POST` | `/api/auth/volunteer/login`    | Public |
| `POST` | `/api/auth/admin/login`        | Public |

### Volunteers

| Method  | Endpoint                       | Access       |
| ------- | ------------------------------ | ------------ |
| `GET`   | `/api/volunteers`              | Police Admin |
| `PATCH` | `/api/volunteers/:id/verify`   | Police Admin |
| `PATCH` | `/api/volunteers/:id/activate` | Police Admin |

### Assistance Requests

| Method  | Endpoint                   | Access                            |
| ------- | -------------------------- | --------------------------------- |
| `POST`  | `/api/requests`            | Senior / Police Admin             |
| `GET`   | `/api/requests`            | Senior / Volunteer / Police Admin |
| `PATCH` | `/api/requests/:id/assign` | Police Admin                      |
| `PATCH` | `/api/requests/:id/status` | Volunteer / Police Admin          |

### Emergency

| Method | Endpoint           | Access       |
| ------ | ------------------ | ------------ |
| `POST` | `/api/emergencies` | Police Admin |

### Audit Logs

| Method | Endpoint          | Access       |
| ------ | ----------------- | ------------ |
| `GET`  | `/api/audit-logs` | Police Admin |

> Detailed request bodies, authentication requirements, response formats, and example API calls will be provided in the project's API documentation.

---

## ⚙️ Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB Atlas account or MongoDB instance

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/agronex-sahayak-backend.git
```

```bash
cd agronex-sahayak-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

> Never commit `.env` to GitHub. Use `.env.example` as the reference configuration.

### 4. Start the development server

```bash
npm run dev
```

For production-style execution:

```bash
npm start
```

The server runs by default at:

```text
http://localhost:5000
```

---

## 🧪 Testing & Verification

The Evaluation 2 implementation is verified through API testing covering the core backend workflow.

The demonstration includes:

```text
Volunteer Registration
        ↓
Volunteer Login
        ↓
Admin Login
        ↓
Volunteer Verification
        ↓
Volunteer Activation
        ↓
Assistance Request
        ↓
Volunteer Assignment
        ↓
Request Status Update
        ↓
Emergency Record
        ↓
Audit Log
```

Test evidence and screenshots are maintained as part of the Evaluation 2 submission.

---

## 🎥 Demonstration

### YouTube Video

**Evaluation 2 Backend Demonstration:**
[▶️ Watch the 5-Minute Demonstration](https://youtu.be/fq3BohuEsoA)

> The demonstration covers the proposed functionality, implemented backend features, API workflow, database interaction, and differences between the Evaluation 1 proposal and the current implementation.

**YouTube Link:** `https://youtu.be/fq3BohuEsoA`

Replace `(https://youtu.be/fq3BohuEsoA)` with the final YouTube video URL after uploading the demonstration.
Replace `https://youtu.be/fq3BohuEsoA` with the final YouTube video URL after uploading the demonstration.

---

## 📋 Evaluation 1 → Evaluation 2 Changes

The Evaluation 1 document described the proposed backend architecture and functionality.

During implementation, some features were adjusted and some functionality was deferred to the next implementation stage.

The updated Evaluation 1 document records:

* Original proposed functionality
* Actually implemented functionality
* Changes made during development
* Reason for changes
* Functionality planned for the next stage

---

## 🚀 Future Development

The project will continue beyond the current Evaluation 2 milestone.

Planned development includes:

* Additional senior profile functionality
* Extended emergency management
* Enhanced request validation and state handling
* Automated backend testing
* Additional security and production hardening
* Remaining backend functionality
* Frontend application integration

---

## 👥 Team

**AgroNex Sahayak — HPL 2026**

Backend implementation developed as part of the HPL 2026 project.

---

## 📄 Project Status

**Current Milestone:** Round 1 — Evaluation 2

**Implementation Target:** 50% Backend Implementation

**Next Milestone:** Round 2 — Complete Backend Implementation

---

> **AgroNex Sahayak** — Technology for safer, more connected community assistance.
