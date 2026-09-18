# AgroNex Sahayak Backend — API Documentation

## Base URL

```text
http://localhost:5000
```

All API routes use the `/api` prefix unless otherwise specified.

---

# 1. Authentication

## 1.1 Volunteer Registration

### `POST /api/auth/volunteer/register`

Registers a new volunteer account.

**Authentication:** Not required

### Request Body

```json
{
  "name": "Rahul Kumar",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "password": "Volunteer@123"
}
```

### Required Fields

* `name`
* `phone`
* `password`

### Optional Fields

* `email`

### Success Response

```json
{
  "success": true,
  "message": "Volunteer registered successfully",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "Rahul Kumar",
      "phone": "9876543210",
      "email": "rahul@example.com",
      "role": "VOLUNTEER"
    }
  }
}
```

The password hash is not returned.

### Possible Errors

* `400` — Required fields missing
* `400` — Phone or email already registered
* `500` — Server error

---

## 1.2 Volunteer Login

### `POST /api/auth/volunteer/login`

Authenticates a registered volunteer and returns a JWT.

**Authentication:** Not required

### Request Body

```json
{
  "phone": "9876543210",
  "password": "Volunteer@123"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Volunteer login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "USER_ID",
      "name": "Rahul Kumar",
      "phone": "9876543210",
      "email": "rahul@example.com",
      "role": "VOLUNTEER"
    }
  }
}
```

### Possible Errors

* `400` — Phone or password missing
* `401` — Invalid credentials
* `401` — User is not a volunteer

---

## 1.3 Police Admin Login

### `POST /api/auth/admin/login`

Authenticates a Police Admin and returns a JWT.

**Authentication:** Not required

### Request Body

```json
{
  "phone": "9999999999",
  "password": "Admin@123"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "USER_ID",
      "name": "Admin",
      "phone": "9999999999",
      "email": "admin@agronex.local",
      "role": "POLICE_ADMIN"
    }
  }
}
```

### Possible Errors

* `400` — Phone or password missing
* `401` — Invalid credentials
* `401` — User is not a Police Admin

---

# 2. Volunteer Management

All volunteer management endpoints require a valid Police Admin JWT.

Use:

```text
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

---

## 2.1 Get Volunteers

### `GET /api/volunteers`

Returns the registered volunteers and their profile information.

**Authentication:** Required

**Role:** `POLICE_ADMIN`

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "USER_ID",
      "name": "Rahul Kumar",
      "phone": "9876543210",
      "email": "rahul@example.com",
      "role": "VOLUNTEER",
      "status": "ACTIVE",
      "availability": true,
      "skills": [],
      "organisationId": null,
      "verificationNotes": null
    }
  ]
}
```

The `passwordHash` is excluded from the response.

### Possible Errors

* `401` — Authentication required
* `403` — Insufficient permissions
* `500` — Server error

---

## 2.2 Verify Volunteer

### `PATCH /api/volunteers/:id/verify`

Verifies a registered volunteer.

**Authentication:** Required

**Role:** `POLICE_ADMIN`

### URL Parameter

```text
:id = Volunteer User ID
```

### Request Body

```json
{
  "verificationNotes": "Identity documents verified"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Volunteer verified successfully"
}
```

The volunteer status changes:

```text
REGISTERED → VERIFIED
```

### Possible Errors

* `400` — Volunteer is not in `REGISTERED` state
* `401` — Authentication required
* `403` — Police Admin access required
* `404` — Volunteer not found

---

## 2.3 Activate Volunteer

### `PATCH /api/volunteers/:id/activate`

Activates a previously verified volunteer.

**Authentication:** Required

**Role:** `POLICE_ADMIN`

### URL Parameter

```text
:id = Volunteer User ID
```

### Success Response

```json
{
  "success": true,
  "message": "Volunteer activated successfully"
}
```

The volunteer status changes:

```text
VERIFIED → ACTIVE
```

Only active volunteers can be assigned to assistance requests.

### Possible Errors

* `400` — Volunteer is not verified
* `401` — Authentication required
* `403` — Police Admin access required
* `404` — Volunteer not found

---

# 3. Assistance Requests

## 3.1 Create Assistance Request

### `POST /api/requests`

Creates a new assistance request.

**Authentication:** Required

**Roles:** `SENIOR`, `POLICE_ADMIN`

### Headers

```text
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body

```json
{
  "need": "Medicine pickup",
  "location": {
    "address": "Udupi",
    "latitude": 13.3409,
    "longitude": 74.7421
  },
  "priority": "URGENT"
}
```

### Required Fields

* `need`
* `location`

### Priority Values

```text
ROUTINE
URGENT
EMERGENCY
```

### Default

If `priority` is not supplied:

```text
ROUTINE
```

### Initial Status

```text
PENDING
```

### Success Response

```json
{
  "success": true,
  "message": "Assistance request created successfully",
  "data": {
    "_id": "REQUEST_ID",
    "seniorId": "USER_ID",
    "volunteerId": null,
    "need": "Medicine pickup",
    "location": {
      "address": "Udupi",
      "latitude": 13.3409,
      "longitude": 74.7421
    },
    "priority": "URGENT",
    "status": "PENDING"
  }
}
```

### Possible Errors

* `400` — Required information missing
* `401` — Authentication required
* `403` — Role not permitted
* `500` — Server error

---

## 3.2 Get Assistance Requests

### `GET /api/requests`

Returns requests according to the authenticated user's role.

**Authentication:** Required

**Roles:** `SENIOR`, `VOLUNTEER`, `POLICE_ADMIN`

### Behaviour

**Senior**

Returns their own requests.

**Volunteer**

Returns requests assigned to that volunteer.

**Police Admin**

Returns all assistance requests.

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "REQUEST_ID",
      "seniorId": "SENIOR_ID",
      "volunteerId": "VOLUNTEER_ID",
      "need": "Medicine pickup",
      "location": {
        "address": "Udupi",
        "latitude": 13.3409,
        "longitude": 74.7421
      },
      "priority": "URGENT",
      "status": "ASSIGNED",
      "createdAt": "TIMESTAMP"
    }
  ]
}
```

---

## 3.3 Assign Volunteer

### `PATCH /api/requests/:id/assign`

Assigns an active volunteer to a pending assistance request.

**Authentication:** Required

**Role:** `POLICE_ADMIN`

### URL Parameter

```text
:id = Assistance Request ID
```

### Request Body

```json
{
  "volunteerId": "VOLUNTEER_USER_ID"
}
```

### Assignment Rules

The request must be:

```text
PENDING
```

The volunteer must be:

```text
ACTIVE
```

### State Change

```text
PENDING → ASSIGNED
```

### Success Response

```json
{
  "success": true,
  "message": "Volunteer assigned successfully",
  "data": {
    "requestId": "REQUEST_ID",
    "volunteerId": "VOLUNTEER_USER_ID",
    "status": "ASSIGNED"
  }
}
```

An audit log is created for the assignment.

### Possible Errors

* `400` — Request is not pending
* `400` — Volunteer is not active
* `401` — Authentication required
* `403` — Police Admin access required
* `404` — Request or volunteer not found

---

## 3.4 Update Request Status

### `PATCH /api/requests/:id/status`

Updates the status of an assistance request.

**Authentication:** Required

**Roles:** `VOLUNTEER`, `POLICE_ADMIN`

### URL Parameter

```text
:id = Assistance Request ID
```

### Request Body

```json
{
  "status": "IN_PROGRESS"
}
```

### Supported Status Values

```text
ASSIGNED
IN_PROGRESS
COMPLETED
```

### Success Response

```json
{
  "success": true,
  "message": "Request status updated successfully",
  "data": {
    "requestId": "REQUEST_ID",
    "status": "IN_PROGRESS"
  }
}
```

An audit log is created when the status is updated.

### Completion Rule

Once a request reaches:

```text
COMPLETED
```

it cannot be modified through this endpoint.

### Possible Errors

* `400` — Invalid status
* `400` — Request already completed
* `401` — Authentication required
* `403` — Role not permitted
* `403` — Volunteer is not assigned to the request
* `404` — Request not found

---

# 4. Emergency Management

## 4.1 Create Emergency Record

### `POST /api/emergencies`

Creates an emergency record associated with an assistance request.

**Authentication:** Required

**Role:** `POLICE_ADMIN`

### Request Body

```json
{
  "requestId": "REQUEST_ID",
  "details": "Immediate police assistance required"
}
```

### Required Fields

* `requestId`
* `details`

### Initial Escalation Status

```text
PENDING
```

### Success Response

```json
{
  "success": true,
  "message": "Emergency record created successfully",
  "data": {
    "_id": "EMERGENCY_ID",
    "requestId": "REQUEST_ID",
    "escalationStatus": "PENDING",
    "details": "Immediate police assistance required"
  }
}
```

An audit log is created for the emergency record.

### Possible Errors

* `400` — Required information missing
* `401` — Authentication required
* `403` — Police Admin access required
* `404` — Assistance request not found

---

# 5. Audit Logs

## 5.1 Get Audit Logs

### `GET /api/audit-logs`

Returns recorded audit events.

**Authentication:** Required

**Role:** `POLICE_ADMIN`

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "AUDIT_ID",
      "userId": "USER_ID",
      "requestId": "REQUEST_ID",
      "action": "REQUEST_ASSIGNED",
      "timestamp": "TIMESTAMP"
    }
  ]
}
```

Audit entries are generated for important request and emergency actions.

### Possible Errors

* `401` — Authentication required
* `403` — Police Admin access required
* `500` — Server error

---

# 6. Server Health Check

## `GET /`

Checks whether the backend server is running.

**Authentication:** Not required

### Success Response

```json
{
  "success": true,
  "message": "AgroNex Sahayak Backend is running"
}
```

---

# 7. Authentication Workflow

```text
User
 │
 ▼
Login
 │
 ▼
JWT Token
 │
 ▼
Authorization Header
 │
 ▼
JWT Middleware
 │
 ▼
Role Middleware
 │
 ▼
Controller
 │
 ▼
Database
```

Example:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

# 8. Volunteer Lifecycle

```text
REGISTERED
     │
     │ Police Admin verifies
     ▼
VERIFIED
     │
     │ Police Admin activates
     ▼
ACTIVE
```

Only an `ACTIVE` volunteer can be assigned to an assistance request.

---

# 9. Assistance Request Workflow

```text
PENDING
   │
   │ Police Admin assigns active volunteer
   ▼
ASSIGNED
   │
   │ Volunteer starts work
   ▼
IN_PROGRESS
   │
   │ Assistance completed
   ▼
COMPLETED
```

Important request actions are recorded through the audit logging service.

---

# 10. Standard Response Format

### Success

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description of the error"
  }
}
```

---

# 11. HTTP Status Codes

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| `200`  | Successful request                             |
| `201`  | Resource created                               |
| `400`  | Invalid request / validation error             |
| `401`  | Authentication required or invalid credentials |
| `403`  | Insufficient permissions                       |
| `404`  | Resource not found                             |
| `500`  | Internal server error                          |

---

# 12. Evaluation 2 API Coverage

The following implemented API groups are demonstrated as part of the current Evaluation 2 milestone:

* Authentication
* Volunteer management
* Assistance request management
* Volunteer assignment
* Request status management
* Emergency record creation
* Audit logging

Additional backend functionality will be implemented during the subsequent development stage.
