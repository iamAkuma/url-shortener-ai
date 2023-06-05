const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cheerio = require('cheerio');
const validUrl = require('valid-url');

const app = express();
const PORT = 3000;
const MONGODB_URI = 'mongodb://localhost:27017/url-shortener';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB Connection
let db;
MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) throw err;
  db = client.db();
  console.log('Connected to MongoDB');
});

// Routes
app.post('/shorten', (req, res) => {
  const longUrl = req.body.url;

  // Validate the URL
  if (!validUrl.isUri(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Generate a short code
  const shortCode = generateShortCode();

  // Save the URL in the database
  db.collection('urls').insertOne({ longUrl, shortCode }, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const shortUrl = `${req.protocol}://${req.hostname}/${shortCode}`;
    res.status(200).json({ shortUrl });
  });
});

app.get('/:code', (req, res) => {
  const shortCode = req.params.code;

  // Retrieve the long URL from the database
  db.collection('urls').findOne({ shortCode }, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!result) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.redirect(result.longUrl);
  });
});

// Helper function to generate a short code
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
