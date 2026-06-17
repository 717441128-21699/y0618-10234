import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', '..', 'data', 'roommate.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      avatar VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      real_name_verified BOOLEAN DEFAULT 0,
      id_card VARCHAR(18),
      real_name VARCHAR(50),
      sleep_time VARCHAR(10),
      wake_time VARCHAR(10),
      has_pet BOOLEAN DEFAULT 0,
      pet_type VARCHAR(50),
      smoking VARCHAR(20) DEFAULT 'never',
      gender_preference VARCHAR(10) DEFAULT 'any',
      cleaning_frequency VARCHAR(50),
      social_preference VARCHAR(50),
      gender VARCHAR(10),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      landlord_id INTEGER NOT NULL,
      title VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      district VARCHAR(50) NOT NULL,
      rent INTEGER NOT NULL,
      area INTEGER NOT NULL,
      room_type VARCHAR(50) NOT NULL,
      orientation VARCHAR(20),
      floor VARCHAR(50),
      photos TEXT,
      facilities TEXT,
      description TEXT,
      expected_sleep_time VARCHAR(10),
      expected_wake_time VARCHAR(10),
      allow_pet BOOLEAN DEFAULT 0,
      allow_smoking BOOLEAN DEFAULT 0,
      gender_preference VARCHAR(10) DEFAULT 'any',
      max_occupants INTEGER DEFAULT 1,
      current_occupants INTEGER DEFAULT 0,
      is_recruitment BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (landlord_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      seeker_id INTEGER NOT NULL,
      overall_score INTEGER NOT NULL,
      sleep_score INTEGER NOT NULL,
      pet_score INTEGER NOT NULL,
      smoking_score INTEGER NOT NULL,
      gender_score INTEGER NOT NULL,
      habit_score INTEGER NOT NULL,
      location_score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (seeker_id) REFERENCES users(id),
      UNIQUE(house_id, seeker_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id VARCHAR(50) NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'text',
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      party_a_id INTEGER NOT NULL,
      party_b_id INTEGER NOT NULL,
      content TEXT,
      public_area_rules TEXT,
      cost_sharing TEXT,
      penalty_terms TEXT,
      start_date DATE,
      end_date DATE,
      signature_a TEXT,
      signature_b TEXT,
      signed_at DATETIME,
      status VARCHAR(20) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (party_a_id) REFERENCES users(id),
      FOREIGN KEY (party_b_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      respondent_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      evidences TEXT,
      mediator_id INTEGER,
      status VARCHAR(20) DEFAULT 'pending',
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (respondent_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mediation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispute_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispute_id) REFERENCES disputes(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_houses_district ON houses(district)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_houses_rent ON houses(rent)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_matches_seeker ON matches(seeker_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);

  console.log('Tables created successfully');
});

export default db;
