const db = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await db.execute(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    [table, column]
  );
  return rows.length > 0;
}

async function migrate() {
  if (!(await columnExists('items', 'given_to_department'))) {
    await db.execute('ALTER TABLE items ADD COLUMN given_to_department BOOLEAN NOT NULL DEFAULT FALSE AFTER verification_hint');
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      recipient_id INT NOT NULL,
      item_id INT NULL,
      body TEXT NOT NULL,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_messages_sender_recipient (sender_id, recipient_id, created_at),
      INDEX idx_messages_recipient_read (recipient_id, read_at),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    INSERT INTO locations (name, latitude, longitude) VALUES
      ('Block 4', 12.93570000, 77.60600000),
      ('R&D', 12.93580000, 77.60660000),
      ('Boys Hostel', 12.93340000, 77.60800000),
      ('Girls Hostel', 12.93320000, 77.60680000)
    ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude)
  `);

  console.log('Feature migration complete: department handoff, messages, and campus locations are ready.');
}

migrate().catch(err => {
  console.error('Feature migration failed:', err.message);
  process.exitCode = 1;
}).finally(() => db.end());
