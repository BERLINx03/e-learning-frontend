# E-Learning Platform

A modern, responsive e-learning platform built with React, TypeScript, and Tailwind CSS that connects students with instructors in a seamless online learning environment.

## Features

### Authentication & User Management

- Secure user authentication with JWT
- Role-based access control (Student, Instructor, Admin)
- User profile management
- Password management

### For Students

- Browse available courses
- Enroll in courses
- Track learning progress
- Access course materials

### For Instructors

- Comprehensive dashboard with statistics
- Course management (create, edit, delete)
- Lesson management
- Student progress tracking
- Profile settings

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Components**: Custom components with Tailwind

## API Integration

The frontend connects to a RESTful API with these endpoints:

### Authentication

- POST `/api/Users/login` - User login
- POST `/api/Users/register/student` - Register as student
- POST `/api/Users/register/instructor` - Register as instructor
- GET `/api/Users/profile` - Get user profile
- PUT `/api/Users/profile` - Update user profile
- PUT `/api/Users/change-password` - Change password

### Courses

- GET `/api/Courses` - Get all courses
- POST `/api/Courses` - Create new course
- GET `/api/Courses/{id}` - Get course details
- PUT `/api/Courses/{id}` - Update course
- DELETE `/api/Courses/{id}` - Delete course

### Lessons

- GET `/api/Lessons/course/{courseId}` - Get lessons for a course
- POST `/api/Lessons` - Create new lesson
- GET `/api/Lessons/{id}` - Get lesson details
- PUT `/api/Lessons/{id}` - Update lesson
- DELETE `/api/Lessons/{id}` - Delete lesson

### Progress Tracking

- GET `/api/Lessons/course/{courseId}/progress` - Get course progress
- GET `/api/Lessons/{lessonId}/progress` - Get lesson progress

## Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/e-learning-platform.git
   cd e-learning-platform
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Configure the API endpoint
   Update the `baseURL` in `src/api/axios.ts` to point to your backend server

4. Start the development server
   ```
   npm start
   ```

## Project Structure

```
src/
├── api/             # API configuration and axios setup
├── components/      # Reusable UI components
├── contexts/        # React Context for state management
├── pages/           # Page components
│   ├── auth/        # Authentication pages (login, register)
│   ├── instructor/  # Instructor-specific pages
│   └── student/     # Student-specific pages
└── types/           # TypeScript type definitions
```

## Features in Development

- Quiz and assessment system
- Discussion forums
- Real-time notifications
- Video conferencing integration
- Payment processing for course enrollment

## License

This project is licensed under the MIT License - see the LICENSE file for details.
