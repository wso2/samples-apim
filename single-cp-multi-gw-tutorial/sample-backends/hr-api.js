const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());

// In-memory employee storage
let employees = [
  {
    id: "e101",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    department: "Engineering",
    position: "Software Engineer",
    dateOfJoining: "2022-03-15"
  }
];

// GET /employees - List all employees
app.get('/employees', (req, res) => {
  res.json(employees);
});

// POST /employees - Add a new employee
app.post('/employees', (req, res) => {
  const employee = req.body;

  if (!employee.id || !employee.firstName || !employee.lastName || !employee.email) {
    return res.status(400).json({ message: "Missing required employee fields (id, firstName, lastName, email)" });
  }

  employees.push(employee);
  res.status(201).json({ message: "Employee created" });
});

// GET /employees/:employeeId - Get employee by ID
app.get('/employees/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
});

// Start the server
app.listen(port, () => {
  console.log(`HR System API running at http://localhost:${port}`);
});
