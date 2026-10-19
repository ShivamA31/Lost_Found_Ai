USE lost_and_found_ai;

-- Default password is 'password123'
-- bcrypt hash for the documented demo password: password123
SET @default_password_hash = '$2b$10$/tIrb2ZwBP5MGbKwDgRLaOMTWNE326tdxJxw2nKe.QsZGI6U/1eg2';

INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@campus.edu', @default_password_hash, 'ADMIN'),
('Alice Smith', 'alice@campus.edu', @default_password_hash, 'STUDENT'),
('Bob Johnson', 'bob@campus.edu', @default_password_hash, 'STUDENT'),
('Charlie Brown', 'charlie@campus.edu', @default_password_hash, 'STUDENT'),
('Diana Prince', 'diana@campus.edu', @default_password_hash, 'STUDENT'),
('Evan Wright', 'evan@campus.edu', @default_password_hash, 'STUDENT')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- Also repair demo passwords if these accounts were seeded with the old hash.
UPDATE users
SET password_hash = @default_password_hash
WHERE email IN ('admin@campus.edu', 'alice@campus.edu', 'bob@campus.edu', 'charlie@campus.edu', 'diana@campus.edu', 'evan@campus.edu');

INSERT INTO categories (name) VALUES 
('Electronics'), ('Documents'), ('Bags'), ('Wallets'), ('Keys'), 
('Books'), ('Clothing'), ('Accessories'), ('Bottles'), ('Other');

-- Campus center approx 12.9345, 77.6065
INSERT INTO locations (name, latitude, longitude) VALUES 
('Block 1', 12.9350, 77.6060), 
('Block 2', 12.9348, 77.6062), 
('Block 3', 12.9345, 77.6065), 
('Library', 12.9342, 77.6068), 
('Cafeteria', 12.9340, 77.6070), 
('Parking', 12.9338, 77.6072), 
('Hostel', 12.9335, 77.6075), 
('Auditorium', 12.9352, 77.6068), 
('Sports Complex', 12.9355, 77.6072), 
('Main Gate', 12.9360, 77.6050), 
('Block 4', 12.9357, 77.6060),
('R&D', 12.9358, 77.6066),
('Boys Hostel', 12.9334, 77.6080),
('Girls Hostel', 12.9332, 77.6068),
('Other', NULL, NULL);

-- Items
INSERT INTO items (user_id, type, title, description, category_id, location_id, latitude, longitude, location_note, date_occurred, verification_hint, status, color) VALUES 
(2, 'LOST', 'Black Laptop Bag', 'Lost my Dell laptop backpack. Has a red zipper.', 3, 4, 12.9342, 77.6068, 'Left it near the reading section', '2026-10-01', NULL, 'ACTIVE', 'black'),
(3, 'FOUND', 'Dark Computer Backpack', 'Found a black backpack with a red accent on the zipper.', 3, 4, 12.9343, 77.6069, 'Found on a chair in the library', '2026-10-02', 'What brand is the laptop inside?', 'ACTIVE', 'black'),

(4, 'LOST', 'Blue Water Bottle', 'Milton blue steel water bottle.', 9, 5, 12.9340, 77.6070, 'Near the juice counter', '2026-10-03', NULL, 'ACTIVE', 'blue'),
(5, 'FOUND', 'Steel Flask', 'Blue coloured insulated flask.', 9, 5, 12.9340, 77.6070, 'Left on a cafeteria table', '2026-10-03', 'Is there any sticker on it?', 'ACTIVE', 'blue'),

(2, 'LOST', 'Student ID Card', 'Lost my ID card, name is Alice Smith.', 2, 6, 12.9338, 77.6072, 'Probably dropped in parking', '2026-10-04', NULL, 'ACTIVE', 'white'),
(6, 'FOUND', 'ID Card - Alice', 'Found an ID card in the parking lot.', 2, 6, 12.9338, 77.6072, 'Near the bike stand', '2026-10-04', 'What is the registration number on the card?', 'ACTIVE', 'white'),

(3, 'LOST', 'Airpods Pro', 'White Apple Airpods Pro in a silicone case.', 1, 1, 12.9350, 77.6060, 'Classroom 101', '2026-10-05', NULL, 'ACTIVE', 'white'),
(5, 'FOUND', 'Wireless Earbuds', 'Found white wireless earphones in a case.', 1, 1, 12.9350, 77.6060, 'Under a desk in room 101', '2026-10-05', 'What color is the silicone case?', 'ACTIVE', 'white'),

(4, 'LOST', 'Car Keys', 'Honda car keys with a leather keychain.', 5, 10, 12.9360, 77.6050, 'Dropped while entering', '2026-10-02', NULL, 'ACTIVE', 'black'),
(2, 'FOUND', 'Keys with leather strap', 'Found a set of keys near the gate.', 5, 10, 12.9360, 77.6050, 'Given to the security guard', '2026-10-02', 'Which car brand is on the key?', 'ACTIVE', 'brown'),

(6, 'LOST', 'Calculus Textbook', 'Thomas Calculus 14th edition, hardbound.', 6, 4, 12.9342, 77.6068, 'Reading room', '2026-09-28', NULL, 'ACTIVE', 'blue'),
(3, 'FOUND', 'Math Book', 'Found a large calculus textbook.', 6, 4, 12.9342, 77.6068, 'On table 5', '2026-09-29', 'Is there a name written on the first page?', 'ACTIVE', 'blue'),

(2, 'LOST', 'Umbrella', 'Black folding umbrella.', 8, 2, 12.9348, 77.6062, 'Corridor', '2026-10-01', NULL, 'ACTIVE', 'black'),
(5, 'FOUND', 'Black Umbrella', 'Small foldable umbrella.', 8, 2, 12.9348, 77.6062, 'Near the stairs', '2026-10-02', 'Does it have automatic open button?', 'ACTIVE', 'black'),

(3, 'LOST', 'Sunglasses', 'Rayban aviators.', 8, 9, 12.9355, 77.6072, 'Basketball court', '2026-10-03', NULL, 'ACTIVE', 'gold'),
(4, 'FOUND', 'Aviator shades', 'Found sunglasses.', 8, 9, 12.9355, 77.6072, 'On the bleachers', '2026-10-04', 'What color are the lenses?', 'ACTIVE', 'gold'),

(5, 'LOST', 'Wallet', 'Brown leather wallet with cash and cards.', 4, 5, 12.9340, 77.6070, 'Cafeteria', '2026-10-04', NULL, 'ACTIVE', 'brown'),
(6, 'FOUND', 'Brown Wallet', 'Leather wallet found.', 4, 5, 12.9340, 77.6070, 'Near the washroom', '2026-10-05', 'Whose driving license is inside?', 'ACTIVE', 'brown'),

(4, 'LOST', 'Jacket', 'Grey hoodie, size M.', 7, 8, 12.9352, 77.6068, 'Auditorium seat', '2026-09-30', NULL, 'ACTIVE', 'grey'),
(2, 'FOUND', 'Grey Sweater', 'Found a hoodie.', 7, 8, 12.9352, 77.6068, 'Back row', '2026-10-01', 'What is the brand on the tag?', 'ACTIVE', 'grey');
