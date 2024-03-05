const http = require('http');
const url = require('url');
const mysql = require('mysql');

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'hockey04',
  database: 'lab5'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
  
  // SQL query to create table if not exists
  const createTableQuery = `CREATE TABLE IF NOT EXISTS patients (
    patientid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    dateOfBirth datetime
  ) ENGINE=InnoDB`;
  
  // Execute SQL query to create table
  connection.query(createTableQuery, (err, result) => {
    if (err) throw err;
    console.log('Patients table created or already exists');
  });
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    if (pathname === '/insert') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        let postData;
        try {
          postData = JSON.parse(body);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid JSON data');
          return;
        }
  
        if (Array.isArray(postData)) {
          // If postData is an array, insert multiple patients
          const insertQuery = 'INSERT INTO patients (name, dateOfBirth) VALUES ?';
          const values = postData.map(patient => [patient.name, patient.dateOfBirth]);
          connection.query(insertQuery, [values], (err, result) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error inserting data into database');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('Data inserted successfully');
            }
          });
        } else {
          // If postData is a single object, insert a single patient
          const { name, dateOfBirth } = postData;
          const insertQuery = `INSERT INTO patients (name, dateOfBirth) VALUES (?, ?)`;
          connection.query(insertQuery, [name, dateOfBirth], (err, result) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error inserting data into database');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('Data inserted successfully');
            }
          });
        }
      });
    }
  } else if (req.method === 'GET') {
    if (pathname === '/query') {
      const query = parsedUrl.query.query;
      connection.query(query, (err, result) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error executing query');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        }
      });
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

// Listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
