require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
