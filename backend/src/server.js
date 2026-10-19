const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function startServer() {
  try {
    // Check DB connection
    const connection = await db.getConnection();
    console.log('Connected to MySQL database.');
    connection.release();

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  }
}

startServer();
