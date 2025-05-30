const express = require('express');
const app = express();
const port = 3500;

app.use(express.json());

// In-memory report storage
let reports = [
  {
    reportId: "rpt-2024-001",
    title: "Annual GDPR Compliance Audit",
    submittedBy: "compliance.officer@example.com",
    status: "Pending",
    submissionDate: "2024-12-31",
    content: "Details of the audit findings and compliance status..."
  }
];

// GET /reports - List all compliance reports
app.get('/reports', (req, res) => {
  res.json(reports);
});

// POST /reports - Submit a new compliance report
app.post('/reports', (req, res) => {
  const report = req.body;

  if (!report.reportId || !report.title || !report.submittedBy || !report.submissionDate) {
    return res.status(400).json({ message: "Missing required report fields (reportId, title, submittedBy, submissionDate)" });
  }

  reports.push({
    ...report,
    status: report.status || "Pending"
  });

  res.status(201).json({ message: "Report submitted successfully" });
});

// GET /reports/:reportId - Get a specific report by ID
app.get('/reports/:reportId', (req, res) => {
  const { reportId } = req.params;
  const report = reports.find(r => r.reportId === reportId);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  res.json(report);
});

// Start the server
app.listen(port, () => {
  console.log(`Compliance Report API running at http://localhost:${port}`);
});
