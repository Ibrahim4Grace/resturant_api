# Chef-kay Restaurant Food Delivery Platform

A monolithic-based food delivery platform that connects restaurants, customers, riders, and administrators. The platform facilitates food ordering, delivery management, and overall system monitoring.

## 🚀 Features

### For Customers

- User registration and authentication
- Browse restaurants and menus
- Place and track orders
- Real-time delivery tracking
- Payment integration (Paystack)
- Order history
- Review and rating system

### For Restaurants

- Restaurant dashboard
- Menu management
- Order management
- Business analytics
- Profile management
- Payment tracking

### For Riders

- Delivery task management
- Real-time order notifications
- Delivery route optimization
- Earnings tracking
- Status updates
- Profile management

### For Administrators

- System monitoring
- User management
- Restaurant approval system
- Rider management
- Analytics dashboard
- Payment oversight

## 🛠 Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Paystack
- **Real-time Updates**: WebSocket
- **Architecture**: Microservices

## 📦 Microservices

1. **Auth Service**

    - User authentication and authorization
    - JWT token management
    - Role-based access control

2. **User Service**

    - Customer profile management
    - Order history
    - Reviews and ratings

3. **Restaurant Service**

    - Restaurant profile management
    - Menu management
    - Order processing

4. **Order Service**

    - Order creation and management
    - Order tracking
    - Delivery status updates

5. **Payment Service**

    - Payment processing
    - Transaction management
    - Payment history

6. **Delivery Service**

    - Rider assignment
    - Delivery tracking
    - Route optimization

7. **Admin Service**
    - System administration
    - Analytics and reporting
    - User management

## 💽 Data Models

### User Model

```javascript
{
  name: String,
  email: String,
  password: String,
  phone: String,
  address: String,
  role: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Restaurant Model

```javascript
{
  name: String,
  email: String,
  phone: String,
  address: String,
  cuisine: [String],
  openingHours: Object,
  status: String,
  rating: Number,
  menu: [MenuItemSchema],
  bankDetails: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model

```javascript
{
  userId: ObjectId,
  restaurantId: ObjectId,
  items: [OrderItemSchema],
  total_price: Number,
  subtotal: Number,
  tax: Number,
  delivery_fee: Number,
  status: String,
  delivery_info: Object,
  payment_status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Rider Model

```javascript
{
  name: String,
  email: String,
  phone: String,
  vehicle_type: String,
  license_number: String,
  status: String,
  current_location: Object,
  earnings: Number,
  ratings: Number,
  createdAt: Date,
  updatedAt: Date
}
```

🚀 Getting Started
Prerequisites
Node.js (v14 or higher)

MongoDB

Paystack account

npm or yarn

Installation
Clone the repository
git clone https://github.com/yourusername/food-delivery-platform.git

Install dependencies for each service
cd service-name
npm install

Configure environment variables
cp .env.example .env

Start the services
npm run start

📡 API Documentation
API documentation is available at /api/docs after starting the server. The documentation includes:

Authentication endpoints

User management

Restaurant operations

Order management

Payment processing

Delivery tracking

🔒 Security Features
JWT authentication

Password hashing

Role-based access control

Input validation

Rate limiting

Security headers

Future Improvements
Implement real-time chat between users and riders

Add support for multiple payment gateways

Implement AI-based order recommendation system

Add multi-language support

Implement automated testing pipeline

Add support for scheduled deliveries

Authors
Your Name - Initial work - [YourGithub](https://github.com/Ibrahim4Grace)
