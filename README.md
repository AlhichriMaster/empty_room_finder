# Empty Classroom Finder

A web application that helps students and faculty find available classrooms at any given time. Built with React, Node.js, and PostgreSQL.

## Features

- Real-time empty classroom search
- Filter by building, time, and date
- Sort results by building or availability
- Additional filters for room capacity and equipment
- Modern, responsive UI design
- Built with future 3D visualization support in mind

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd empty-classroom-finder
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up the database:
- Create a PostgreSQL database
- Copy `.env.example` to `.env` in the backend directory
- Update the DATABASE_URL in `.env` with your PostgreSQL credentials

4. Run migrations and import data:
```bash
cd backend
npx prisma migrate dev
npm run import-data
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Project Structure

```
emptyclass/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── index.ts
│   │   ├── importData.ts
│   │   └── utils.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── class_schedules/
    └── [CSV files]
```

## API Endpoints

### GET /api/empty-rooms
Query Parameters:
- `date`: YYYY-MM-DD
- `time`: HH:mm
- `building`: (optional) Building name
- `minCapacity`: (optional) Minimum room capacity
- `hasProjector`: (optional) true/false

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments

- Built as a personal project
- Author: Youssuf Hichri
