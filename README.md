# AURA Lifestyle Store — Professional Single-Store E-Commerce Platform

A complete, production-grade, single-store E-Commerce Platform built with **React, TypeScript, Tailwind CSS, Node.js, Express, and MongoDB**. Designed specifically for a single business/store operator (not a SaaS / multi-tenant product), featuring a modern shopping storefront and an enterprise-grade Admin Control Panel.

---

## 🌟 Key Highlights & Roles

### 1. Normal Customer / Shopper
- **Public Storefront**: Responsive home page with hero carousel, featured categories, best-selling products (calculated from real orders), new arrivals, and promotional banners.
- **Catalog & Discovery**: Instant search with debounce, multi-facet filtering (category, brand, price range, rating, discount, stock availability), and multiple sort options (newest, price, rating, best-selling).
- **Product Details**: Multi-image interactive gallery, product video viewer, size/color variant selection with live stock feedback, specifications table, delivery timeline estimator, customer ratings & verified reviews.
- **Cart & Wishlist**: Real-time cart calculations (subtotal, MRP savings, automatic delivery thresholds, GST calculation), persistent wishlist with one-click move to cart.
- **Checkout & Payment**: Saved address selector, new address modal, promotional coupon validation (`WELCOME10`, `FESTIVE25`, `FLAT500`), and safe payment gateway integration (Razorpay ready + badged server-verified Demo Payment mode).
- **Customer Account**:
  - Account Dashboard with order history overview and quick actions
  - Order Details with a visual 6-stage delivery stepper (`Order Placed` → `Confirmed` → `Packed` → `Shipped` → `Out for Delivery` → `Delivered`)
  - 7-Day Return & Refund Request modal with reason selection and photo uploads
  - My Reviews with verified purchase badge and rating submission
  - Address book management (Home/Work, Default address tag)
  - Profile & Security settings

### 2. Store Administrator
- **KPI Metrics Dashboard**: 11 real database-driven KPI cards (Total Users, Total Customers, Total Orders, Total Products, Today's Sales, Total Revenue, Pending Orders, Returned Orders, Low Stock Alerts, Open Issues, Website Health Status) with dynamic **[Week] [Month] [Year]** revenue window toggling.
- **Visual Analytics**: Interactive Recharts graphs showing gross sales, net revenue, discount volume, and order frequency across date ranges.
- **Product Management**: Full CRUD for products, multi-image upload with preview, video embed, variant management, SKU generation, and publish/unpublish toggle.
- **Category Hierarchy**: Category creation with slug generator, cover image, and real-time active product count.
- **Inventory & Stock Control**: Live stock tables with quick +/- adjustment modal, low stock threshold alerts, out-of-stock badges, and detailed immutable inventory audit logs recording who changed stock, the exact timestamp, quantity, and business reason.
- **Order Fulfillment & State Machine**: Order table with pagination and status filters. Strict backend state machine enforcing valid transitions: `Pending` → `Confirmed` → `Processing` → `Packed` → `Shipped` (with tracking ID & delivery partner) → `Out for Delivery` → `Delivered`.
- **Returns & Refunds Management**: Review customer return requests, inspect uploaded damage photos, approve/reject claims, and execute recorded refunds with optional automatic stock restoration.
- **Promotional Coupon Engine**: Create percentage or fixed-amount discounts, set minimum order values, maximum discount caps, usage limits, and expiration dates.
- **Accounting & Business Reports**: Generate and export downloadable CSV reports for Sales, Inventory Valuation, Customer List, and Returns.
- **System Health Diagnostics**: Real-time telemetry monitoring Backend API latency, MongoDB connection state, media storage availability, Auth subsystem, Payment gateway mode, and Sentry error monitoring.
- **Bug & Error Center**: Structured issue tracker capturing route, stack trace, timestamp, and severity with a live test error trigger button.
- **Security Audit Logs**: Comprehensive compliance logging of all administrative actions (product changes, stock edits, status updates, refunds, and category deletions).

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express, TypeScript, Zod, Multer, Helmet, CORS |
| **Database** | MongoDB with Mongoose (includes automatic embedded fallback via `mongodb-memory-server` when no local daemon is installed) |
| **Authentication** | JWT authentication + Firebase Phone OTP ("123456" instant demo simulation) + Google OAuth flow ready |
| **Payments** | Razorpay SDK abstraction + server-verified Demo Payment mode |
| **Testing** | Vitest with 17 integration & full-flow end-to-end tests (100% passing) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node.js v22.14.0)
- npm or yarn

### 1. Repository Setup & Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd E-commerce

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create `.env` in both `server` and `client` folders using the provided `.env.example` templates:

**`server/.env`**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/aura_ecommerce
JWT_SECRET=aura_super_secure_jwt_secret_key_2026_antigravity
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Razorpay (leave blank for built-in server-verified Demo Mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional: Cloudinary (leave blank to serve uploads locally from public/uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Locally in Development

Start backend (Port 5000):
```bash
cd server
npm run dev
```

Start frontend (Port 5173):
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Demo Seed Accounts & Credentials

The server automatically seeds the database on first boot if empty:

| Role | Email | Password | Phone OTP |
|---|---|---|---|
| **Admin** | `admin@aura.store` | `Admin@123456` | `123456` |
| **Customer** | `priya.sharma@example.com` | `Customer@123456` | `123456` |
| **Customer** | `rohit.mehta@example.com` | `Customer@123456` | `123456` |
| **Customer** | `ananya.iyer@example.com` | `Customer@123456` | `123456` |

### Active Demo Coupons
- **`WELCOME10`**: 10% off on all orders (Max ₹500)
- **`FESTIVE25`**: 25% off on orders above ₹2,999 (Max ₹1,500)
- **`FLAT500`**: Flat ₹500 off on orders above ₹2,499

---

## 🧪 Testing

Run the full automated test suite (17/17 tests passing):

```bash
cd server
npm test
```

### Test Coverage includes:
1. Customer signup, password hashing, and JWT token issuance
2. Phone OTP authentication flow
3. Role-based authorization (`admin` vs `customer` route guards)
4. Active category and product filtering
5. Cart operations and stock validation
6. Promotional coupon validation and boundary tests
7. Server-side order creation and inventory deduction
8. Order state machine validation (`confirmed` → `processing` → `packed` → `shipped` → `delivered`)
9. Admin KPI database aggregation
10. CSV export report generation
11. System health diagnostics telemetry

---

## 📦 Production Deployment

### 1. Build the Frontend
```bash
cd client
npm run build
```
The compiled SPA is output to `client/dist/` ready to be served by NGINX, Cloudflare Pages, Vercel, or Express static middleware.

### 2. Build the Backend
```bash
cd server
npm run build
npm start
```

### 3. Production Environment Checklist
- Set `NODE_ENV=production`
- Configure a persistent MongoDB instance (e.g. MongoDB Atlas URI)
- Supply `CLOUDINARY_*` keys for CDN media delivery
- Supply `RAZORPAY_*` keys for live payment processing
- Set `SENTRY_DSN` for real-time error reporting
