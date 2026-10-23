# CodeCraftHub

A small Express API I built to keep track of courses I want to take. It was mainly a way to practise REST basics, so there's no database or login. Everything gets saved to `courses.json`.

## Setup

You'll need Node.js installed.

```bash
npm install
npm start
```

The server runs on http://localhost:5000. Use `npm run dev` instead if you want it to restart when you change files.

## Course format

```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started",
  "created_at": "2025-11-04 10:30:00"
}
```

`id` and `created_at` are filled in automatically. Everything else is required when you add a course. The status has to be `Not Started`, `In Progress` or `Completed`, and the date has to be in `YYYY-MM-DD` format.

## Endpoints

```
POST    /api/courses          add a course
GET     /api/courses          list all courses
GET     /api/courses/stats    totals by status
GET     /api/courses/:id      get one course
PUT     /api/courses/:id      update a course
DELETE  /api/courses/:id      delete a course
```

Add a course:

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Python Basics","description":"Learn Python fundamentals","target_date":"2025-12-31","status":"Not Started"}'
```

Update one. You only have to send the fields you're changing:

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'
```

Get stats:

```bash
curl http://localhost:5000/api/courses/stats
```

```json
{
  "success": true,
  "stats": {
    "total_courses": 3,
    "by_status": { "Not Started": 1, "In Progress": 1, "Completed": 1 }
  }
}
```

The other endpoints work the same way, e.g. `curl http://localhost:5000/api/courses/1` or `curl -X DELETE http://localhost:5000/api/courses/1`.

If you're on Windows PowerShell, type `curl.exe` rather than `curl`. Postman works too.

## Troubleshooting

If you get `Cannot find module 'express'`, you haven't run `npm install` yet.

If port 5000 is already taken, close whatever's using it or change `PORT` at the top of `app.js`.

## Structure

```
codecrafthub/
├── app.js              # Main Express application
├── courses.json        # JSON file for data storage (auto-created)
├── package.json        # Node.js dependencies
└── README.md           # Project documentation
```
