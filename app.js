// CodeCraftHub - a simple REST API to track courses you want to learn.
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'courses.json');
const VALID_STATUSES = ['Not Started', 'In Progress', 'Completed'];
const REQUIRED_FIELDS = ['name', 'description', 'target_date', 'status'];

// Parse JSON request bodies
app.use(express.json());

// ---------- Helpers ----------

// Read courses from the JSON file (creates the file if it doesn't exist)
function loadCourses() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]');
        return [];
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
}

// Write courses back to the JSON file
function saveCourses(courses) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2));
}

// Next ID = highest existing ID + 1 (starts at 1)
function getNextId(courses) {
    return courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;
}

// Check that a date is a real date in YYYY-MM-DD format
function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !isNaN(d) && d.toISOString().startsWith(value);
}

// Returns an error message for bad fields, or null if everything is fine
function validate(data) {
    if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
        return `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    }
    if (data.target_date !== undefined && !isValidDate(data.target_date)) {
        return 'target_date must be a valid date in YYYY-MM-DD format';
    }
    return null;
}

// ---------- Routes ----------

// GET all courses
app.get('/api/courses', (req, res) => {
    const courses = loadCourses();
    res.json({ success: true, count: courses.length, courses });
});

// GET course statistics
// (Must come BEFORE /api/courses/:id, otherwise "stats" is treated as an id)
app.get('/api/courses/stats', (req, res) => {
    const courses = loadCourses();
    const by_status = {};
    VALID_STATUSES.forEach(s => (by_status[s] = 0));
    courses.forEach(c => {
        if (by_status[c.status] !== undefined) by_status[c.status]++;
    });
    res.json({ success: true, stats: { total_courses: courses.length, by_status } });
});

// GET a single course
app.get('/api/courses/:id', (req, res) => {
    const course = loadCourses().find(c => c.id === Number(req.params.id));
    if (!course) {
        return res.status(404).json({ success: false, error: `Course with ID ${req.params.id} not found` });
    }
    res.json({ success: true, course });
});

// POST a new course
app.post('/api/courses', (req, res) => {
    const data = req.body || {};

    const missing = REQUIRED_FIELDS.filter(f => !data[f]);
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    }
    const error = validate(data);
    if (error) return res.status(400).json({ success: false, error });

    const courses = loadCourses();
    const course = {
        id: getNextId(courses),
        name: data.name,
        description: data.description,
        target_date: data.target_date,
        status: data.status,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    courses.push(course);
    saveCourses(courses);

    res.status(201).json({ success: true, message: 'Course added successfully', course });
});

// PUT (update) a course - only the fields you send are changed
app.put('/api/courses/:id', (req, res) => {
    const data = req.body || {};
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, error: 'No data provided' });
    }
    const error = validate(data);
    if (error) return res.status(400).json({ success: false, error });

    const courses = loadCourses();
    const course = courses.find(c => c.id === Number(req.params.id));
    if (!course) {
        return res.status(404).json({ success: false, error: `Course with ID ${req.params.id} not found` });
    }

    REQUIRED_FIELDS.forEach(f => {
        if (data[f]) course[f] = data[f];
    });
    saveCourses(courses);

    res.json({ success: true, message: 'Course updated successfully', course });
});

// DELETE a course
app.delete('/api/courses/:id', (req, res) => {
    const courses = loadCourses();
    const index = courses.findIndex(c => c.id === Number(req.params.id));
    if (index === -1) {
        return res.status(404).json({ success: false, error: `Course with ID ${req.params.id} not found` });
    }
    const [deleted] = courses.splice(index, 1);
    saveCourses(courses);

    res.json({ success: true, message: 'Course deleted successfully', deleted_course: deleted });
});

// ---------- Error handling ----------

// Unknown routes
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Catches bad JSON bodies and file read/write errors
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, error: 'Invalid JSON in request body' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: `Server error: ${err.message}` });
});

// ---------- Start ----------

app.listen(PORT, () => {
    loadCourses(); // make sure courses.json exists
    console.log('CodeCraftHub API is starting...');
    console.log(`Data will be stored in: ${DATA_FILE}`);
    console.log(`API is available at: http://localhost:${PORT}`);
});
