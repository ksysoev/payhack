const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
//const app = express();

// MySQL connection configuration
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: 'zer0pay',
  port: '3306'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

// Define your routes and middleware here

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL connection configuration
// ...

// Define your routes and middleware here
app.post('/create', (req, res) => {
  // const {wallet_public_key, balance, currency} = req.body;
  let params  = req.body;
  
const insertQuery = "INSERT INTO wallet_balances (wallet_public_key, balance, currency) VALUES (?, ?, 'MYR')";
//  const values = [wallet_public_key, balance, currency];

// JSON.parse()
//  connection.query(insertQuery, values, (err, result) => {
  connection.query(insertQuery, [params.wallet_public_key, 0],(err, result) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).send('Error creating a new row in MySQL');
      return;
    }
    res.status(200).send('New row created successfully!');
  });
});

// Start the server
// ...

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
  connection.query('SELECT * FROM wallet_balances', (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).send('Error fetching data from MySQL');
      return;
    }
    res.json(results);
  });
});


