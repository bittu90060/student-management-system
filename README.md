# Student Management System

A full-stack Student Management System developed as part of my Full Stack Development Internship task at Auspify Technologies.

## Project Overview
This application helps manage student records through a simple and responsive dashboard.

## Features
- Add new students
- View student details
- Update student records
- Delete student records
- Search students by name, ID, email, or phone
- Filter students by class
- Export student records to CSV

## Technology Stack

**Frontend**
- React.js
- JavaScript
- HTML5 and CSS3
- Vite

**Backend**
- Node.js
- Express.js
- REST APIs

**Database**
- MongoDB Atlas
- Mongoose

## Project Structure

- `frontend/` — React user interface
- `backend/` — Express server, student model, and API routes

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/bittu90060/student-management-system.git
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:

   ```bash
   cd ../backend
   npm install
   ```

4. Create a `.env` file inside the `backend/` folder:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   ```

5. Start the backend:

   ```bash
   npm run dev
   ```

6. In another terminal, start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

## Security
Environment variables and database credentials should never be committed to GitHub.

## Author
Bittu Kumar Kushwaha

GitHub: https://github.com/bittu90060

## Internship Task
Task 2 — Student Management System  
Auspify Technologies
