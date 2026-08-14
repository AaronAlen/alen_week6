# Security Audit & Database Performance Report

**Project**: Secure Mini Team Task Manager  
**Scope**: Week 6 Security & Database Management  

---

## 1. Authentication Strategy

* **Stateless JWT Architecture**: User identity is verified using JSON Web Tokens (JWT). The server does not maintain server-side sessions, allowing simple horizontal scaling.
* **Dual-Token System**:
  * **Access Token**: Short-lived (`15 minutes`). Used to authenticate API requests via HTTP `Authorization: Bearer <token>` header.
  * **Refresh Token**: Long-lived (`7 days`). Sent to `/api/auth/refresh` when access token expires to issue a fresh access token without forcing user re-login.
* **Token Payload Minimization**: The JWT payload contains only essential claims (`userId`, `role`). Sensitive info (password hash, full profile) is excluded to prevent data exposure if decoded on the client.

---

## 2. Password Security

* **Bcrypt Hashing**: Raw passwords are never stored in the database. All user passwords are processed through `bcrypt.hash()` during registration.
* **Salt & Salt Rounds**: A cost factor of `10` salt rounds is used. This adds random salt bytes to mitigate rainbow table attacks and introduces a ~100ms computational delay to thwart brute-force password cracking while keeping server CPU usage reasonable.

---

## 3. Authorization & Access Control

* **Role-Based Access Control (RBAC)**: Enforced via `authorize('ADMIN')` middleware. Restricted routes (e.g. `/api/admin/users`, `/api/admin/activity`) return `403 Forbidden` for standard `USER` tokens.
* **Resource Ownership Control**: In `taskController.js`, queries check whether `task.userId === req.user.userId`. Users cannot edit or delete another user's task simply by altering the ID in the request parameters.

---

## 4. API Layer Security

* **HTTP Security Headers (`helmet`)**: Configures headers to disable client-side caching of sensitive data, block MIME type sniffing (`X-Content-Type-Options: nosniff`), and prevent iframe clickjacking (`X-Frame-Options: DENY`).
* **CORS Protection**: Restricted to trusted origin (`http://localhost:5173`) with explicit credential support.
* **Rate Limiting (`express-rate-limit`)**: Protects `/api/` endpoints against automated brute-force attacks and Denial of Service (DoS) by capping requests to 100 per 15 minutes per IP.
* **Sanitized Error Responses**: Express global error handlers sanitize internal exceptions. Database connection strings, stack traces, and SQL queries are logged internally but hidden from API responses.

---

## 5. Database Security

* **SQL Injection Defense**: Sequelize ORM uses parameterized SQL queries under the hood, replacing raw string concatenation with bound variables.
* **NoSQL Injection Defense**: Mongoose schema casting rejects invalid object queries targeting MongoDB.
* **Credential Isolation**: Credentials (`MYSQL_PASSWORD`, `JWT_ACCESS_SECRET`) are stored in environment variables (`.env`) and excluded from source control via `.gitignore`.

---

## 6. Common Risks & Mitigations

| Vulnerability | Mitigation Implemented |
| :--- | :--- |
| **SQL Injection** | Parameterized queries handled by Sequelize ORM. |
| **Brute-Force Attacks** | Rate limiting (`100 req / 15 min`) & bcrypt salt rounds (10). |
| **Broken Object Level Auth (BOLA)** | Explicit `task.userId === req.user.userId` check on update/delete routes. |
| **Credential Exposure** | Passwords hashed with bcrypt; `.env` kept out of Git repository. |
| **Information Disclosure** | Generic HTTP status messages (`Invalid email or password`) for auth failures. |

---

## 7. Database Performance & Optimization

* **Database Indexing**:
  * `users.email`: Unique B-Tree index for $O(1)$ email lookup during login.
  * `tasks.userId`: Non-unique index for fast lookup of a user's task list.
  * `tasks.status`: Index for filtering tasks by state.
* **Connection Pooling**: Sequelize maintains a pool (`max: 10`, `min: 0`, `idle: 10000ms`) to reuse open TCP database connections rather than opening a new socket per request.
* **ACID Transactions**: Sequelize explicit transactions (`sequelize.transaction()`) guarantee atomicity when creating or altering relational state.
* **Pagination**: Task listing uses `LIMIT` and `OFFSET` queries (`tasks?page=1&limit=10`) to prevent heavy memory usage on large datasets.

---

## 8. Event-Driven Architecture

* **Decoupled Audit Logging**: Node.js `EventEmitter` emits events (`task.created`, `user.login`) from Express controllers. Listeners independently format and write documents into MongoDB `activity_logs` without delaying the HTTP response cycle.

---

## 9. Limitations & Future Work

* **Token Blacklisting**: Currently, tokens remain valid until expiration. Implementing a token revoking black-list (or short expiration window with sliding sessions) would enhance security.
* **OAuth Production Integration**: Google OAuth flow is stubbed for demonstration. Production deployment requires HTTPS callback endpoints and verified Google Cloud Client IDs.
