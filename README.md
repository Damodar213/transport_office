# Transport Office Management System

A comprehensive Next.js application for managing transport operations, including admin dashboard, supplier management, and buyer request handling.

## 🚀 Features

### Admin Dashboard
- **Dynamic Statistics**: Real-time dashboard with live data
- **User Management**: Manage buyers, suppliers, and system users
- **Order Management**: Track and manage transport orders
- **Notification System**: Real-time notifications for new requests
- **Load Type Management**: CRUD operations for transport load types
- **Supplier Communication**: Send orders to multiple suppliers via WhatsApp

### Supplier Portal
- **Truck Management**: Manage vehicle fleet with detailed information
- **Order Tracking**: View and manage assigned orders
- **Driver Information**: Store and manage driver details
- **Notification System**: Real-time notifications for new orders

### Buyer Portal
- **Transport Requests**: Create and submit transport requests
- **Order Tracking**: Track order status and progress
- **Dashboard**: View order history and statistics

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: Custom auth system
- **File Upload**: Built-in upload system
- **Notifications**: Real-time notification system

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arunk89-byte/transport_office2.0.git
   cd transport_office2.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup
The application will automatically create necessary tables on first run:
- `users` - User accounts and authentication
- `suppliers` - Supplier information
- `trucks` - Vehicle management
- `load_types` - Transport load categories
- `transport_request_notifications` - Notification system

## 📁 Project Structure

```
transport_office2.0/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── supplier/          # Supplier portal pages
│   ├── buyer/             # Buyer portal pages
│   └── api/               # API routes
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── supplier/          # Supplier-specific components
│   ├── buyer/             # Buyer-specific components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions and database
├── public/                # Static assets
└── styles/                # Global styles
```

## 🚀 Key Features

### Real-time Notifications
- Instant notifications for new buyer requests
- Admin notification bar with auto-dismiss
- Supplier-specific notification counts

### Dynamic Data Management
- Live dashboard statistics
- Real-time order tracking
- Supplier-specific data isolation

### WhatsApp Integration
- Send order details to suppliers
- Formatted messages with order information
- Multi-supplier selection

### File Management
- Document upload system
- Vehicle document storage
- Driver document management

## 🔐 Security Features

- **Database Connection Pooling**: Robust connection management
- **Error Handling**: Comprehensive error handling and logging
- **Input Validation**: Form validation and sanitization
- **Authentication**: Secure user authentication system

## 📊 Database Schema

### Core Tables
- **users**: User accounts and profiles
- **suppliers**: Supplier company information
- **trucks**: Vehicle fleet management
- **load_types**: Transport load categories
- **transport_request_notifications**: Notification system

### Relationships
- Suppliers belong to users
- Trucks belong to suppliers
- Notifications linked to requests

## 🎯 Usage

### Admin Access
- Navigate to `/admin/dashboard`
- Manage system-wide operations
- Monitor all activities

### Supplier Access
- Navigate to `/supplier/dashboard`
- Manage trucks and drivers
- View assigned orders

### Buyer Access
- Navigate to `/buyer/dashboard`
- Create transport requests
- Track order progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.

---

**Transport Office Management System** - Streamlining transport operations with modern web technology.

