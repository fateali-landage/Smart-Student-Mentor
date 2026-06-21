# 🚀 SmartMentor – Mentorship & Career Development Platform

> A Full-Stack Mentorship, Career Development, and Placement Readiness Platform built using React, Flask, PostgreSQL, and JWT Authentication.

![GitHub](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/Frontend-React%2019-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-black)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![License](https://img.shields.io/badge/License-Educational-green)

---

## 📖 Overview

SmartMentor is a modern full-stack web application designed to bridge the gap between students and mentors while helping learners track their career growth, skill development, and placement readiness.

The platform provides dedicated dashboards for Students, Mentors, and Administrators with secure authentication, performance analytics, career roadmaps, portfolio management, skill assessments, and mentorship workflows.

### 🎯 Key Objectives

* Enable structured mentorship programs
* Track student progress and achievements
* Improve placement readiness
* Provide career guidance through roadmaps
* Facilitate mentor-student collaboration
* Deliver actionable analytics and insights

---

## 🌐 Live Demo

### Frontend Application

https://smart-student-mentor.vercel.app

### Backend API

https://smart-student-mentor.onrender.com

---

## ✨ Features

### 👨‍🎓 Student Portal

* Goal Management System
* Career Roadmaps
* Placement Readiness Tracking
* Portfolio Builder
* Skill Assessments
* Mock Interview Practice
* Achievement Management
* Performance Analytics
* Profile Management

### 👨‍🏫 Mentor Portal

* Mentor Dashboard
* Session Scheduling
* Student Progress Monitoring
* Task Assignment System
* Performance Evaluation
* Feedback Management

### 🛠️ Admin Portal

* User Management
* Role-Based Access Control
* Admin Account Creation
* Platform Analytics
* Report Generation
* Platform Monitoring

---

## 🔒 Security Features

SmartMentor follows secure development practices:

* JWT Authentication
* Refresh Token Authentication
* bcrypt Password Hashing
* Role-Based Access Control (RBAC)
* Protected Routes
* Rate Limiting
* Secure Password Reset Flow
* Admin Registration Protection
* Environment Variable Management
* Secure API Architecture

---

## 🏗️ System Architecture

```text
┌─────────────────────────┐
│   React + Vite Client   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      Flask API          │
│ Authentication & RBAC   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ PostgreSQL (Neon DB)    │
└─────────────────────────┘
```

---

## ⚙️ Tech Stack

### Frontend

* React 19
* Vite
* Tailwind CSS
* Recharts
* Context API

### Backend

* Python
* Flask
* Flask-CORS
* JWT Authentication
* bcrypt

### Database

* PostgreSQL
* Neon Serverless Database

### Deployment

* Vercel
* Render

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/fateali-landage/Smart-Student-Mentor.git

cd Smart-Student-Mentor
```

---

### Backend Setup

```bash
cd backend

python -m venv venv

# Activate virtual environment

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

python app.py
```

Backend will run on:

```bash
http://localhost:5000
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

## 🔧 Environment Variables

Create a `.env` file inside the backend directory.

```env
DATABASE_URL=your_database_url

JWT_SECRET=your_jwt_secret

JWT_REFRESH_SECRET=your_refresh_secret

FLASK_ENV=development

FRONTEND_URL=http://localhost:5173
```

---

## 👥 User Roles

### Student

* Manage Career Goals
* Build Professional Portfolio
* Complete Skill Assessments
* Attend Mentorship Sessions
* Track Placement Readiness

### Mentor

* Review Student Progress
* Schedule Sessions
* Assign Tasks
* Evaluate Performance
* Provide Feedback

### Admin

* Manage Platform Users
* Create Administrators
* Generate Reports
* Monitor Platform Activities
* Manage Access Control

---

## 📊 Project Highlights

✅ Full-Stack Architecture

✅ Cloud Deployment

✅ PostgreSQL Integration

✅ Secure JWT Authentication

✅ Role-Based Dashboards

✅ Analytics & Reporting

✅ Responsive UI Design

✅ Production-Ready Structure

✅ Modern Software Engineering Practices

---

## 📈 Future Enhancements

* AI Career Recommendations
* Resume Analyzer
* AI Interview Assistant
* Job Recommendation Engine
* Email Notifications
* Video Mentorship Integration
* Real-Time Chat System
* WebSocket Support
* Mobile Application
* Docker Deployment
* CI/CD Pipeline

---

## 👨‍💻 Author

### Fateali Landage

GitHub:
https://github.com/fateali-landage

LinkedIn:
https://www.linkedin.com/in/fatealilandage

---

## 📜 License

This project is developed for educational, portfolio, and professional showcase purposes.

---

## © Ownership

SmartMentor is owned, maintained, and actively developed by **Fatheali Landage**.

This project demonstrates:

* Full-Stack Development
* Secure Authentication Systems
* Role-Based Access Control
* Database Design & Integration
* Cloud Deployment
* API Development
* Modern Web Application Architecture

© 2026 Fatheali Landage. All Rights Reserved.
