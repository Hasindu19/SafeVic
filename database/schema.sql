-- Drop tables if exist (for reset)
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(120) UNIQUE NOT NULL,
                       password_hash TEXT NOT NULL,
                       role VARCHAR(20) DEFAULT 'admin',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE reports (
                         id SERIAL PRIMARY KEY,
                         incident_type VARCHAR(100) NOT NULL,
                         description TEXT NOT NULL,
                         suburb VARCHAR(100) NOT NULL,
                         latitude DECIMAL(10,7) NOT NULL,
                         longitude DECIMAL(10,7) NOT NULL,
                         incident_time TIMESTAMP NOT NULL,
                         is_anonymous BOOLEAN DEFAULT false,
                         status VARCHAR(20) DEFAULT 'pending',
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);