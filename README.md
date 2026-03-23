# 🚨 SafeVic – Community Safety Reporting & Hotspot Monitoring Platform

SafeVic is a full-stack web application designed to support community safety awareness and data-driven incident monitoring.
The platform allows citizens to report safety incidents with location details, while administrators can analyse reports through dashboards and hotspot summaries.

This project demonstrates how community-generated data can be used to improve early risk detection and support better local safety planning.

---

## 🌟 Features

### 👤 Citizen Features

* Submit safety / crime incident reports
* Provide location (latitude & longitude)
* Add incident description and time
* Anonymous reporting option
* View incidents on an interactive map

### 🛠️ Admin Features

* View all submitted reports
* Hotspot summary based on suburb report count
* Incident monitoring dashboard
* Status tracking (pending / reviewed / resolved)

### 📊 Data Insights

* Location-based incident visualization
* Basic hotspot detection using report frequency
* Structured REST API for report management

---

## 🧑‍💻 Tech Stack

### Frontend

* React (Vite)
* React Router
* Axios
* Leaflet Maps

### Backend

* Node.js
* Express.js
* JWT Authentication
* bcrypt Password Hashing

### Database

* PostgreSQL

---

## 📁 Project Structure

```
safevic/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── components/
│   │   └── App.jsx
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── app.js
│   │   └── server.js
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

## ⚙️ Installation Guide

### 1️⃣ Clone Repository

```
git clone https://github.com/YOUR_USERNAME/safevic.git
cd safevic
```

---

### 2️⃣ Setup Backend

```
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=safevic_db
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=supersecretkey
```

Start backend server:

```
npm run dev
```

---

### 3️⃣ Setup Database

Run SQL script:

```
psql -U postgres -d safevic_db -f database/schema.sql
```

---

### 4️⃣ Setup Frontend

```
cd ../frontend
npm install
npm run dev
```

Open browser:

```
http://localhost:5173
```

---

## 🔌 API Endpoints

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Reports

* `POST /api/reports`
* `GET /api/reports`

---

## 📸 Screenshots

*Add screenshots here*

* Report Form
* Dashboard
* Map View
* Hotspot Summary

---

## 🚀 Future Improvements

* Image upload for incident evidence
* Role-based access control
* Advanced hotspot prediction (Machine Learning)
* Real-time notifications
* Vehicle theft alert system
* Mobile responsive PWA version
* Deployment with Docker & Cloud hosting

---

## 🎯 Project Purpose

This project was developed as a portfolio application to demonstrate full-stack development skills including:

* REST API design
* Database modelling
* Authentication implementation
* Map integration
* Form validation
* Data visualization

---

## 📄 License

This project is developed for educational and portfolio purposes.
