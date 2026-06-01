# Agricultural Equipment Rental Management System

A responsive, secure, and modern web application linking local equipment owners with farmers for equipment sharing and rental management. Designed with an earthy forest theme.

---

## Technical Architecture

### 1. PHP REST API Backend
- **Data Persistence**: MySQL with customized transaction indexing.
- **Connection Model**: Native object-oriented PDO.
- **Authentication Protocol**: Custom session-free JSON Web Tokens (JWT) using HMAC-SHA256 signature verification.
- **Location**: Located in the `./backend/` directory.

### 2. React SPA Frontend
- **Bundler**: Vite.
- **State Controls**: React Context API (`AuthContext`) handling token refresh and role-based permissions.
- **Navigation Routing**: React Router v6 featuring declarative Route Guards (`ProtectedRoute`).
- **Styling Layouts**: Modular premium custom CSS layout utilizing variable tokens.
- **Location**: Located in the `./frontend/` directory.

---

## Local Setup & Deployment Guide

### Phase 1: Database Setup
1. Open your MySQL administration terminal (e.g. phpMyAdmin).
2. Execute the DDL queries contained in: `./database/schema.sql` to instantiate the `agrent_db` database and corresponding structural tables.

### Phase 2: Deploying PHP API Backend (e.g., Apache / XAMPP)
1. Place the entire project directory inside your local web root folder (e.g. `C:\xampp\htdocs\` or `C:\wamp64\www\`).
2. Verify the configuration parameters inside `./backend/config/db.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'agrent_db');
   ```
3. Test backend accessibility in your web browser: `http://localhost/agricultural-rental-system/backend/api/equipment.php`.

### Phase 3: Launching React Frontend
1. Open a command line interface in the `./frontend/` folder.
2. Install npm dependency configurations:
   ```bash
   npm install
   ```
3. Boot up the Vite local development hot-reload server:
   ```bash
   npm run dev
   ```
4. Access the React catalog client at `http://localhost:3000`.

---

## System Capabilities Demonstration Flows

1. **Member Sign Up**: Choose the **Join us** link, select **Rent Tools (Farmer)** or **List Tools (Owner)**, and click register.
2. **Machinery Listing**: Access as an Owner, use the **+ Add New Equipment** dashboard utility, specify machinery name, daily billing rate, category, and publish.
3. **Reservations Workflow**: Access as a Farmer, select any machinery from the catalog, input rental start/end dates (dynamic pricing calculated in real-time), and click request.
4. **Approval Processing**: Access as an Owner, select the **Rental Requests** dashboard console, and approve/reject farmer requests.
