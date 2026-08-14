# Secure Mini Team Task Manager — Week 6 Internship Project

A practical full-stack Task Management application built for **Week 6: Security & Database Management**. 

This application demonstrates **dual-database architecture (MySQL + MongoDB)**, stateless **JWT authentication with Refresh Tokens**, **Role-Based Access Control (RBAC)**, **Database Normalization**, **SQL JOINs**, **ACID Transactions**, **Connection Pooling**, **Database Indexing**, and **Event-Driven Audit Logging**.

---

## 📌 Features

* 🔐 **Authentication**: User Signup, Login, Logout, and Token Refresh (`15m` access, `7d` refresh tokens).
* 🛡️ **Role-Based Access Control (RBAC)**: `USER` role (manages own tasks) and `ADMIN` role (manages all users and tasks).
* 📝 **Task CRUD**: Create, Read, Update, Delete tasks with ownership verification.
* ⚡ **Event-Driven Architecture**: Decoupled audit logging triggered via Node.js `EventEmitter`.
* 📊 **MongoDB Aggregations**: Admin statistics calculated using MongoDB `$group` aggregation pipeline.
* 🚀 **Database Performance**: MySQL Connection Pooling, Indexing (`email`, `userId`, `status`), SQL JOINs, and explicit Transactions.
* 🛡️ **API Security**: `helmet` headers, CORS protection, `express-rate-limit` rate limiting, `bcrypt` password hashing.

---

## 🛠️ Technology Stack

* **Frontend**: React, Vite, JavaScript, Axios, React Router DOM, Custom CSS
* **Backend**: Node.js, Express.js, JavaScript, dotenv, CORS, Helmet, express-rate-limit
* **Databases**:
  * **MySQL** (Relational Data: `users`, `tasks`) via **Sequelize ORM**
  * **MongoDB** (Audit Logs: `activity_logs`) via **Mongoose ODM**
* **Security & Auth**: `bcrypt` (Salt rounds: 10), `jsonwebtoken` (JWT)

---

## 📐 System Architecture

```text
React Frontend (Vite + Axios)
       |
       | HTTP Requests with Bearer JWT
       v
Express Backend API (Port 5000)
       |
       +----------------------------+
       |                            |
       v                            v
 Authentication              Task Management
 (bcrypt / JWT)              (Ownership Checks)
       |                            |
       +--------------+-------------+
                      |
              Sequelize ORM
                      |
                 MySQL DB
             (users, tasks)

   (On Event Trigger: task.created, user.login)
                      |
                      v
             Node.js EventEmitter
                      |
                      v
            Mongoose Activity Log
                      |
                      v
                 MongoDB DB
              (activity_logs)
```

---

## 📂 Project Folder Structure

```text
week6-task-manager/
├── backend/
│   ├── config/
│   │   ├── mysql.js        # Sequelize connection & pool settings
│   │   └── mongodb.js      # Mongoose connection
│   ├── models/
│   │   ├── User.js         # MySQL User model (email index)
│   │   ├── Task.js         # MySQL Task model (userId & status index)
│   │   ├── ActivityLog.js  # Mongoose ActivityLog document schema
│   │   └── index.js        # User 1:N Task relationship definition
│   ├── controllers/
│   │   ├── authController.js   # Signup, Login, Refresh, Profile
│   │   ├── taskController.js   # Task CRUD, Pagination, Transaction
│   │   └── adminController.js  # Users management & MongoDB $group aggregation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authenticate.js # JWT Bearer validation
│   │   └── authorize.js    # Role-Based Access Control (RBAC)
│   ├── events/
│   │   └── taskEvents.js   # Node.js EventEmitter for MongoDB logging
│   ├── utils/
│   │   └── tokens.js       # JWT Access & Refresh token signing/verifying
│   ├── app.js              # Express app setup (Helmet, CORS, Rate Limit)
│   └── server.js           # Database sync & HTTP server initialization
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, TaskCard, TaskForm
│   │   ├── pages/          # Login, Signup, Dashboard, Admin
│   │   ├── services/       # Axios API client with token refresh interceptor
│   │   ├── App.jsx
│   │   └── main.jsx
├── SECURITY_AUDIT.md       # Security analysis report
├── WEEK6_CONCEPT_MAPPING.md# Syllabus mapping & interview Q&A
└── README.md
```

---

## 🌐 API Endpoints Table

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Any | Register new account |
| `POST` | `/api/auth/login` | Public | Any | Login & receive Access/Refresh JWTs |
| `POST` | `/api/auth/refresh` | Public | Any | Issue new access token using refresh token |
| `POST` | `/api/auth/logout` | Yes | Any | User logout |
| `GET` | `/api/auth/me` | Yes | Any | Get current user profile |
| `GET` | `/api/tasks` | Yes | User/Admin | Get paginated tasks (JOIN with User) |
| `GET` | `/api/tasks/:id` | Yes | Owner/Admin | Get single task by ID |
| `POST` | `/api/tasks` | Yes | User/Admin | Create new task (Uses SQL Transaction) |
| `PUT` | `/api/tasks/:id` | Yes | Owner/Admin | Update task |
| `DELETE` | `/api/tasks/:id` | Yes | Owner/Admin | Delete task |
| `GET` | `/api/admin/users` | Yes | Admin | List all registered users |
| `PATCH` | `/api/admin/users/:id/role` | Yes | Admin | Change user role (`USER` <-> `ADMIN`) |
| `DELETE` | `/api/admin/users/:id` | Yes | Admin | Delete user account |
| `GET` | `/api/admin/activity` | Yes | Admin | Get MongoDB `$group` aggregation statistics |

---

## 🚀 How to Run the Project

### 1. Prerequisites
- Node.js (v18+)
- MySQL database running on `localhost:3306`
- MongoDB database running on `localhost:27017`

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and adjust MySQL/Mongo credentials
npm run dev
```
The backend server will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The React frontend will run on `http://localhost:5173`.
