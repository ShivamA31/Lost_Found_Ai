const axios = require('axios');
const db = require('../config/db');
const env = require('../config/env');
const matchService = require('../services/matchService');

// Forty realistic lost reports, each paired with a paraphrased found report.
const catalog = [
  ['Electronics', 'Library', 'Silver MacBook Air', 'Silver 13-inch laptop with a small blue sticker near the trackpad.', 'Silver Apple laptop', 'A slim silver Mac laptop with a blue sticker was left beside the library window.', 'silver'],
  ['Electronics', 'Cafeteria', 'White wireless earbuds', 'White Bluetooth earbuds in a charging case with a tiny crack.', 'White Bluetooth earphones', 'Found a pair of white wireless earphones in a slightly cracked case at the cafe.', 'white'],
  ['Electronics', 'Block 2', 'Black noise cancelling headphones', 'Over-ear black Sony headphones with a padded headband.', 'Black Sony headset', 'A black pair of Sony over-ear headphones was on a classroom desk.', 'black'],
  ['Electronics', 'Hostel', 'Blue 64GB USB drive', 'Small blue flash drive with a silver swivel cover.', 'Blue thumb drive', 'Found a blue USB memory stick with a metal rotating cap.', 'blue'],
  ['Electronics', 'Main Gate', 'Black Android phone', 'Black Samsung phone with a clear case and a chipped corner.', 'Samsung smartphone in clear case', 'A black Samsung mobile with transparent cover was handed in at the gate.', 'black'],
  ['Electronics', 'Block 1', 'White phone charger', 'White USB-C wall charger with a long cable.', 'USB-C charger and cable', 'Found a white charging plug with its cable near the lecture rooms.', 'white'],
  ['Electronics', 'Sports Complex', 'Green portable power bank', 'Green 10000mAh battery pack with two USB ports.', 'Green backup battery', 'A green portable phone battery pack was left by the sports hall.', 'green'],
  ['Electronics', 'Auditorium', 'Black fitness smartwatch', 'Black smartwatch with a rectangular screen and silicone strap.', 'Black digital watch', 'Found a black smart wristwatch with a rubber band under an auditorium seat.', 'black'],
  ['Electronics', 'Block 3', 'Space grey tablet', 'Space grey iPad with a folding navy cover.', 'Grey tablet with blue cover', 'A grey Apple tablet in a dark blue folding case was found in a classroom.', 'grey'],
  ['Electronics', 'Library', 'Scientific calculator', 'Casio scientific calculator with the initials AR written inside the cover.', 'Casio maths calculator', 'Found a Casio calculator with AR written under its flip cover.', 'black'],
  ['Electronics', 'Auditorium', 'Black DSLR camera', 'Canon camera with a neck strap and a 50mm lens.', 'Canon camera with strap', 'A Canon DSLR and lens were left near the back row of the auditorium.', 'black'],
  ['Electronics', 'Block 1', 'Wireless computer mouse', 'Grey Logitech wireless mouse with a USB receiver stored underneath.', 'Logitech cordless mouse', 'Found a grey Logitech computer mouse with its tiny receiver.', 'grey'],
  ['Electronics', 'Library', 'Compact mechanical keyboard', 'White 60 percent keyboard with pale blue keycaps.', 'White mini keyboard', 'A small white mechanical keyboard with light blue keys was left at a study table.', 'white'],
  ['Bags', 'Cafeteria', 'Navy blue backpack', 'Navy school bag with a yellow keychain and two front pockets.', 'Blue backpack with yellow charm', 'Found a dark blue rucksack with a yellow key ring at the cafeteria.', 'blue'],
  ['Wallets', 'Main Gate', 'Brown leather wallet', 'Slim brown wallet with a stitched edge and no cash inside.', 'Brown card wallet', 'A small stitched leather wallet was found near the entrance.', 'brown'],
  ['Keys', 'Parking', 'Three silver house keys', 'Three keys on a red fabric tag marked HOME.', 'Keys on red tag', 'Found three silver keys attached to a red cloth key fob in the car park.', 'silver'],
  ['Bottles', 'Sports Complex', 'Purple steel water bottle', 'Purple insulated bottle with a white mountain sticker.', 'Purple thermos flask', 'A purple metal water flask with a mountain decal was left by the courts.', 'purple'],
  ['Other', 'Block 2', 'Compact black umbrella', 'Black folding umbrella with a curved wooden handle.', 'Small black rain umbrella', 'Found a foldable dark umbrella with a brown curved grip in the corridor.', 'black'],
  ['Books', 'Library', 'Calculus textbook', 'Blue Thomas Calculus book, 14th edition, with notes in the margins.', 'Blue maths textbook', 'A blue university calculus text full of handwritten notes was left in the library.', 'blue'],
  ['Books', 'Block 3', 'Green chemistry notebook', 'Green spiral notebook with CHEM 201 written on the front.', 'Chemistry class notes', 'Found a green spiral-bound chemistry notebook marked CHEM 201.', 'green'],
  ['Accessories', 'Auditorium', 'Black pencil case', 'Black canvas pencil pouch containing coloured markers.', 'Black stationery pouch', 'A fabric pencil bag with markers was found under a theatre seat.', 'black'],
  ['Accessories', 'Library', 'Round tortoiseshell glasses', 'Brown round-frame prescription glasses in a hard case.', 'Brown round spectacles', 'Found round brown eyeglasses inside a sturdy case at the reading desk.', 'brown'],
  ['Documents', 'Main Gate', 'Student ID card', 'Campus ID card for Jordan Lee with a blue lanyard.', 'Campus identity badge', 'A student identification card for Jordan Lee on a blue neck strap was found at the entrance.', 'blue'],
  ['Clothing', 'Sports Complex', 'Red zip-up jacket', 'Red medium jacket with a white stripe on each sleeve.', 'Red track jacket', 'Found a red sports jacket with white sleeve stripes near the gym.', 'red'],
  ['Clothing', 'Library', 'Grey university hoodie', 'Grey hoodie with the campus crest embroidered on the chest.', 'Campus grey sweatshirt', 'A grey university pullover bearing the school emblem was left in the library.', 'grey'],
  ['Accessories', 'Cafeteria', 'Silver wristwatch', 'Silver analogue watch with a blue face and metal band.', 'Blue-face silver watch', 'Found a silver wristwatch with a dark blue dial on a cafe table.', 'silver'],
  ['Accessories', 'Block 1', 'Gold signet ring', 'Gold ring engraved with the letter M.', 'Gold letter M ring', 'A gold band with an M engraved on it was found in a lecture room.', 'gold'],
  ['Accessories', 'Hostel', 'Beaded friendship bracelet', 'Blue and white woven bracelet with a small star charm.', 'Blue woven wrist band', 'Found a braided blue-white bracelet with a star decoration in the dorm.', 'blue'],
  ['Bottles', 'Cafeteria', 'Glass lunch container', 'Rectangular glass food box with a green lid.', 'Glass meal box with green top', 'A glass lunch box with a green cover was left on a cafeteria table.', 'green'],
  ['Clothing', 'Block 2', 'Red and black checked scarf', 'Soft red plaid scarf with black lines.', 'Red tartan scarf', 'Found a warm red-and-black checked scarf in the hallway.', 'red'],
  ['Electronics', 'Sports Complex', 'Black gaming headset', 'Black wired gaming headphones with a detachable microphone.', 'Wired headset with mic', 'A dark gaming headset with a boom microphone was found in the computer lab.', 'black'],
  ['Other', 'Sports Complex', 'Tennis racket with blue grip', 'Wilson tennis racket in a black cover, blue handle tape.', 'Wilson racket in case', 'Found a Wilson racquet with blue tape on the grip inside its cover.', 'blue'],
  ['Other', 'Sports Complex', 'Orange basketball', 'Orange basketball with a black marker line near the valve.', 'Orange ball', 'A basketball with a black mark beside the air hole was left on court three.', 'orange'],
  ['Electronics', 'Block 3', 'Laptop power adapter', 'Lenovo 65W laptop charger with a rectangular yellow tip.', 'Lenovo notebook charger', 'Found a Lenovo computer charging adapter with a yellow connector in class.', 'black'],
  ['Electronics', 'Library', 'Portable SSD drive', 'Small black Samsung external solid state drive with a short cable.', 'Samsung external drive', 'A compact Samsung storage drive and cable were found by a library computer.', 'black'],
  ['Electronics', 'Auditorium', 'USB podcast microphone', 'Black USB microphone on a small desk stand.', 'Desktop recording mic', 'Found a black USB recording microphone on the auditorium stage.', 'black'],
  ['Clothing', 'Main Gate', 'Navy baseball cap', 'Navy cap with a white letter C embroidered on the front.', 'Blue cap with C logo', 'A dark blue baseball hat with a white C was handed in at the front gate.', 'blue'],
  ['Documents', 'Library', 'Indian passport', 'Indian passport in a maroon cover belonging to Samira Patel.', 'Maroon passport booklet', 'Found a maroon Indian travel passport for Samira Patel at the library desk.', 'maroon'],
  ['Accessories', 'Block 1', 'Silver USB-C hub', 'Seven-port silver laptop adapter with HDMI and card slots.', 'Multiport laptop dongle', 'A silver seven-in-one computer hub with HDMI was left in the seminar room.', 'silver'],
  ['Electronics', 'Hostel', 'Black Bluetooth speaker', 'Small JBL speaker with a fabric loop and scratched base.', 'JBL portable speaker', 'Found a compact black JBL wireless speaker with a wrist loop in the dorm lounge.', 'black'],
  ['Accessories', 'Library', 'Blue fountain pen', 'Blue and silver fountain pen with a scratch near the clip.', 'Blue ink pen', 'Found a blue-tipped silver writing pen with a nick by its pocket clip at a study desk.', 'blue'],
];

function dateOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function seedItem({ userId, type, title, description, categoryId, location, date, color }) {
  const [existing] = await db.execute(
    'SELECT id FROM items WHERE user_id = ? AND type = ? AND title = ? LIMIT 1',
    [userId, type, title]
  );
  if (existing.length) return existing[0].id;

  const [result] = await db.execute(
    `INSERT INTO items
      (user_id, type, title, description, category_id, location_id, latitude, longitude, location_note, date_occurred, status, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
    [userId, type, title, description, categoryId, location.id, location.latitude, location.longitude, `Demo report near ${location.name}`, date, color]
  );
  return result.insertId;
}

async function main() {
  const [[users], [categories], [locations]] = await Promise.all([
    db.execute("SELECT id, email FROM users WHERE email IN ('alice@campus.edu','bob@campus.edu','charlie@campus.edu','diana@campus.edu','evan@campus.edu') ORDER BY email"),
    db.execute('SELECT id, name FROM categories'),
    db.execute('SELECT id, name, latitude, longitude FROM locations')
  ]);
  if (users.length < 5) throw new Error('Run npm run db:seed first so the five demo student accounts exist.');
  const userByEmail = Object.fromEntries(users.map(user => [user.email, user.id]));
  const userIds = ['alice@campus.edu', 'bob@campus.edu', 'charlie@campus.edu', 'diana@campus.edu', 'evan@campus.edu'].map(email => userByEmail[email]);
  const categoryIds = Object.fromEntries(categories.map(category => [category.name, category.id]));
  const locationByName = Object.fromEntries(locations.map(location => [location.name, location]));
  const expectedTypes = new Set(['LOST', 'FOUND']);
  const newIds = [];

  for (const [index, [category, locationName, lostTitle, lostDescription, foundTitle, foundDescription, color]] of catalog.entries()) {
    const location = locationByName[locationName];
    if (!location || !categoryIds[category]) throw new Error(`Missing seeded category or location for ${lostTitle}.`);
    const lostDate = dateOffset(index % 5);
    const foundDate = dateOffset(Math.max(0, (index % 5) - 1));
    const lostId = await seedItem({ userId: userIds[index % userIds.length], type: 'LOST', title: lostTitle, description: lostDescription, categoryId: categoryIds[category], location, date: lostDate, color });
    const foundId = await seedItem({ userId: userIds[(index + 1) % userIds.length], type: 'FOUND', title: foundTitle, description: foundDescription, categoryId: categoryIds[category], location, date: foundDate, color });
    newIds.push(lostId, foundId);
  }

  const [allItems] = await db.execute(
    'SELECT i.id, i.type, i.title, i.description, i.location_note FROM items i JOIN users u ON i.user_id = u.id WHERE u.email IN (\'admin@campus.edu\', \'alice@campus.edu\', \'bob@campus.edu\', \'charlie@campus.edu\', \'diana@campus.edu\', \'evan@campus.edu\') AND i.status = \'ACTIVE\''
  );
  for (const item of allItems) {
    if (!expectedTypes.has(item.type)) continue;
    const text = `${item.title} ${item.description || ''} ${item.location_note || ''}`.trim();
    const indexResponse = await axios.post(`${env.AI_SERVICE_URL}/index/upsert`, { item_id: item.id, type: item.type, text }, { timeout: 120000 });
    const buffer = Buffer.from(new Float32Array(indexResponse.data.embedding).buffer);
    await db.execute(
      'INSERT INTO item_embeddings (item_id, embedding, model_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE embedding = VALUES(embedding), model_name = VALUES(model_name)',
      [item.id, buffer, 'all-MiniLM-L6-v2']
    );
  }

  const [lostItems] = await db.execute(
    "SELECT i.id FROM items i JOIN users u ON i.user_id = u.id WHERE i.type = 'LOST' AND i.status = 'ACTIVE' AND u.email IN ('admin@campus.edu','alice@campus.edu','bob@campus.edu','charlie@campus.edu','diana@campus.edu','evan@campus.edu')"
  );
  for (const item of lostItems) await matchService.findAndCreateMatches(item.id);

  console.log(`Demo reports ready: ${catalog.length} lost and ${catalog.length} found items; ${allItems.length} AI embeddings indexed.`);
  console.log(`Demo report rows processed: ${newIds.length} (existing rows are reused on reruns).`);
}

main().catch(err => {
  console.error('Demo item setup failed:', err.message);
  process.exitCode = 1;
}).finally(() => db.end());
