# Week 6 Concept Mapping & Mentor Demo Guide

This document links every topic from the **Week 6: Security & Database Management** syllabus directly to our code implementation, providing a step-by-step checklist to present to your mentor alongside answers to common technical interview questions.

---

## 🗺️ Syllabus Concept Mapping

| Week 6 Topic | Code Implementation File | How it Works |
| :--- | :--- | :--- |
| **Authentication** | [authController.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/controllers/authController.js) | Verifies user identity via email/password or JWT tokens. |
| **Authorization (RBAC)** | [authorize.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/middleware/authorize.js) | Restricts endpoints based on user role (`USER` vs `ADMIN`). |
| **JWT Access Tokens** | [tokens.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/utils/tokens.js) | Signs short-lived payload (`15m`) with secret key for API auth. |
| **Refresh Token Strategy** | [tokens.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/utils/tokens.js) & [api.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/frontend/src/services/api.js) | Silent re-authentication via Axios interceptor on HTTP 401 errors. |
| **Bcrypt Hashing** | [authController.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/controllers/authController.js#L30) | Hashes plain text passwords with 10 salt rounds. |
| **Custom Auth Middleware** | [authenticate.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/middleware/authenticate.js) | Parses Bearer token from header and attaches `req.user`. |
| **MySQL Relational Schema** | [User.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/models/User.js) & [Task.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/models/Task.js) | Structured normalized schema with foreign key `userId`. |
| **Database Normalization** | [index.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/models/index.js) | User 1:N Task association prevents data duplication in tasks table. |
| **SQL JOIN Query** | [taskController.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/controllers/taskController.js#L23) | Performs `JOIN` between `tasks` and `users` tables via `include`. |
| **ACID Transactions** | [taskController.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/controllers/taskController.js#L68) | Uses `sequelize.transaction()` with commit/rollback error handling. |
| **Database Indexing** | [User.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/models/User.js#L37) & [Task.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/models/Task.js#L42) | Indexes on `email`, `userId`, and `status` columns. |
| **Connection Pooling** | [mysql.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/config/mysql.js#L24) | Sequelize pool settings (`max: 10`, `min: 0`, `idle: 10000ms`). |
| **Query Optimization** | [taskController.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/controllers/taskController.js#L21) | Selects specific columns (`attributes`) & uses `limit/offset` pagination. |
| **MongoDB Document Schema** | [ActivityLog.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/models/ActivityLog.js) | Mongoose schema storing dynamic audit event payloads. |
| **MongoDB Aggregation** | [adminController.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/controllers/adminController.js#L78) | `$group` pipeline stage counting logs per action type. |
| **Event-Driven Architecture** | [taskEvents.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/events/taskEvents.js) | Node.js `EventEmitter` emitting events (`task.created`) to MongoDB listeners. |
| **API Security Headers** | [app.js](file:///c:/Users/aaron/OneDrive/Desktop/gwc/week6/alen_week6/backend/app.js#L12) | Configures `helmet`, `cors`, and `express-rate-limit`. |

---

## 🎯 Step-by-Step Mentor Demo Checklist

Use this order during your live demonstration:

1. **Demo 1 — Signup & Password Hashing**
   * Register a new account (`USER` role).
   * Show terminal logs / MySQL workbench: Password is stored as a 60-character bcrypt hash `$2b$10$...`.

2. **Demo 2 — Login & Dual Token Issuance**
   * Login with your credentials.
   * Open Browser DevTools -> Application -> LocalStorage: Show `accessToken` and `refreshToken`.

3. **Demo 3 — Task CRUD & Resource Ownership**
   * Create a new task.
   * Update task status from `PENDING` to `IN_PROGRESS`.
   * Show that regular users can only see and manage their own tasks.

4. **Demo 4 — Event-Driven Audit Logging**
   * Explain how creating/updating a task triggers `appEventEmitter.emit('task.created')`.
   * Show MongoDB compass or Admin portal logs: A new document was saved asynchronously in `activity_logs`.

5. **Demo 5 — RBAC Authorization Enforcement**
   * Logged in as `USER`, try accessing `/admin`.
   * App redirects or returns HTTP `403 Forbidden`.
   * Login as `ADMIN` -> Access Admin Portal successfully!

6. **Demo 6 — MongoDB Aggregation Statistics**
   * On Admin Portal, point out the action counts.
   * Explain the `$group` pipeline counting log documents by `action`.

7. **Demo 7 — SQL Concepts (JOIN, Transaction, Index)**
   * Show `taskController.js`: Point out `include: [{ model: User }]` (JOIN), `sequelize.transaction()` (ACID), and index configurations in `User.js` / `Task.js`.

---

## ❓ Common Mentor & Technical Interview Q&A

### Q1: Why use both MySQL and MongoDB instead of just one?
> **Answer**: *"We use polyglot persistence. MySQL handles structured, highly relational data (Users and Tasks) where foreign keys and strict schemas prevent corruption. MongoDB handles activity logs, which are append-only documents with varying JSON payloads that benefit from schema flexibility."*

### Q2: What is the difference between Access Tokens and Refresh Tokens?
> **Answer**: *"Access tokens authorize API requests and have a short lifespan (15 min) to limit exposure if stolen. Refresh tokens have a longer lifespan (7 days) and are stored securely to request a new access token without making the user log in repeatedly."*

### Q3: Why should we never store plain text passwords? What does bcrypt do?
> **Answer**: *"If a database is leaked, plain text passwords expose user accounts across the web. Bcrypt applies a cryptographic hash function with random salt bytes and 10 computation rounds, making rainbow table lookups and brute-force cracking computationally impractical."*

### Q4: What is an ACID Transaction in MySQL?
> **Answer**: *"ACID stands for Atomicity, Consistency, Isolation, and Durability. A transaction ensures that a group of SQL operations either all succeed (COMMIT) or all fail together (ROLLBACK), keeping the database consistent even during system crashes."*

### Q5: How does Node's EventEmitter reduce direct code coupling?
> **Answer**: *"Instead of having HTTP controllers directly import database models for MongoDB audit logging, controllers emit named events like 'task.created'. The event listener handles MongoDB writes independently, keeping controller logic lean."*
