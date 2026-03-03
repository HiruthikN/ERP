# 🏢 ERP System - Complete Business Management

A **production-ready ERP system** for small businesses built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📋 Modules

| Module | Features |
|--------|----------|
| **🔐 Authentication** | Login, Register, JWT, Role-based access (Admin, HR, Sales) |
| **📦 Inventory** | Products CRUD, Categories, Suppliers, Stock tracking, Low stock alerts |
| **🛒 Sales & Invoice** | Multi-item sales, Auto invoice numbers, Tax/Discount, PDF invoices, Payment tracking |
| **👥 HR Management** | Employee CRUD, Attendance tracking, Leave management, Department management |
| **📊 Reports & Analytics** | Dashboard charts, Sales/Inventory/Employee/Profit reports, CSV export |

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt  
**Frontend:** React.js, React Router, Axios, Context API, Chart.js  
**PDF:** PDFKit | **Styling:** Custom CSS

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install MongoDB

**Option A — MongoDB Atlas (Cloud, FREE, Recommended)**  
Best option if you want to **see your data in a browser dashboard**.

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a **Free Shared Cluster**
3. Under **Database Access**, create a database user with a password
4. Under **Network Access**, click **Allow Access from Anywhere**
5. Click **Connect** → **Connect your application** → Copy the connection string
6. It will look like: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/erp-system`

**Option B — Local MongoDB**  
Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) on your machine.  
Default connection: `mongodb://localhost:27017/erp-system`

### Step 2: Configure Environment

Open the `.env` file in the project root and paste your MongoDB connection string:

```env
MONGO_URI=mongodb+srv://hiruthik:Qwert12@cluster0.t0bmgbc.mongodb.net/?appName=Cluster0
JWT_SECRET=erp-super-secret-key-2024-production
PORT=5000
NODE_ENV=development
```

### Step 3: Install & Run

```bash
# Install all dependencies (root + server + client)
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Seed the database with sample data
npm run seed

# Start the application (server + client together)
npm run dev
```

**The app will open at:** [http://localhost:5173](http://localhost:5173)

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@erp.com | Admin@123 |
| **HR** | hr@erp.com | Hr@12345 |
| **Sales** | sales@erp.com | Sales@123 |

---

## 📁 Project Structure

```
EPR-VP-MCA/
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json                  # Root scripts
├── README.md
│
├── server/                       # Backend (Node.js/Express)
│   ├── server.js                 # Entry point
│   ├── seed.js                   # Database seeder
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Supplier.js
│   │   ├── Sale.js
│   │   ├── Employee.js
│   │   └── Attendance.js
│   ├── controllers/              # Business logic
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── supplierController.js
│   │   ├── salesController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   └── dashboardController.js
│   ├── routes/                   # API endpoints
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── supplierRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── dashboardRoutes.js
│   └── middleware/
│       ├── auth.js               # JWT & role verification
│       ├── errorHandler.js       # Global error handler
│       └── validate.js           # Input validation
│
└── client/                       # Frontend (React.js)
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               # Router setup
        ├── index.css             # Global styles
        ├── utils/
        │   └── api.js            # Axios instance
        ├── context/
        │   └── AuthContext.jsx   # Auth state
        ├── components/
        │   ├── Layout.jsx        # Sidebar + main area
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── inventory/
            │   ├── Products.jsx
            │   ├── Categories.jsx
            │   └── Suppliers.jsx
            ├── sales/
            │   └── Sales.jsx
            ├── hr/
            │   ├── Employees.jsx
            │   └── Attendance.jsx
            └── reports/
                └── Reports.jsx
```

---

## 📊 Where is Data Saved?

All your data is saved in **MongoDB** — a database that stores data as JSON-like documents.

### How to View Your Data:

**If using MongoDB Atlas (Cloud):**
1. Log in to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Click your cluster → **Browse Collections**
3. You'll see all your data organized in **collections**:
   - `users` — registered accounts
   - `products` — inventory items
   - `categories` — product categories
   - `suppliers` — supplier information
   - `sales` — all sale transactions
   - `employees` — employee records
   - `attendances` — attendance & leave records

**If using Local MongoDB:**
- Install [MongoDB Compass](https://www.mongodb.com/products/compass) (free GUI tool)
- Connect to `mongodb://localhost:27017`
- Click on the `erp-system` database to see all collections

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET/POST/PUT/DELETE | `/api/products` | Product CRUD |
| GET/POST/PUT/DELETE | `/api/categories` | Category CRUD |
| GET/POST/PUT/DELETE | `/api/suppliers` | Supplier CRUD |
| GET/POST | `/api/sales` | Sales operations |
| GET | `/api/sales/:id/invoice-pdf` | Download invoice PDF |
| GET/POST/PUT/DELETE | `/api/employees` | Employee CRUD |
| GET/POST | `/api/attendance` | Attendance operations |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/export/:type` | Export CSV |

---

## 📝 License

MIT License — Free for personal and commercial use.
