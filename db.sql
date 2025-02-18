-- Crear la base de datos
CREATE DATABASE axiom_db;

-- Usar la base de datos creada
USE axiom_db;

-- Crear la tabla Accounts
CREATE TABLE Accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ID autoincremental como clave primaria
    username VARCHAR(255) NOT NULL,     -- Columna para el nombre de usuario
    password VARCHAR(255) NOT NULL,     -- Columna para la contraseña
    role VARCHAR(50) NOT NULL,          -- Columna para el rol (superuser or user)
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP  -- Columna para la fecha y hora de creación, con valor por defecto
);

-- Crear la tabla Laboratories
CREATE TABLE Laboratories (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ID autoincremental como clave primaria
    nombre VARCHAR(255) NOT NULL,       -- Columna para el nombre del laboratorio
    investigador VARCHAR(255) NOT NULL, -- Columna para el nombre del investigador
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP -- Columna para la fecha con valor por defecto
);

--Crear la tabla Pertenencia a Laboratorios
CREATE TABLE Laboratory_Accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ID autoincremental como clave primaria
    id_laboratory INT NOT NULL,       -- ID del laboratorio
    id_account INT NOT NULL,           -- ID de la cuenta
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP -- Columna para la fecha con valor por defecto
);
-- Crear la tabla Estudiantes
CREATE TABLE Students (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ID autoincremental como clave primaria
    id_accounts INT NOT NULL,                -- ID de la cuenta
    nombre VARCHAR(255) NOT NULL,       -- Columna para el nombre del estudiante
    apellido VARCHAR(255) NOT NULL,     -- Columna para el apellido del estudiante
    edad INT NOT NULL,                   -- Columna para la edad del estudiante
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP -- Columna para la fecha con valor por defecto
    subfijo VARCHAR(255) NOT NULL,       -- Columna para el subfijo del estudiante (Lic., Ing., etc.)
);

-- Crear la tabla Institute
CREATE TABLE Institute (
    id INT AUTO_INCREMENT PRIMARY KEY,     -- Auto-incrementing ID as the primary key
    name VARCHAR(255) NOT NULL,             -- Column for the institute name
    city VARCHAR(255) NOT NULL,             -- Column for the city of the institute
    state VARCHAR(255) NOT NULL,            -- Column for the state or province of the institute
    country VARCHAR(255) NOT NULL,          -- Column for the country of the institute
    date DATETIME DEFAULT CURRENT_TIMESTAMP -- Column for the date with a default value of the current timestamp
);

-- Crear la tabla para registrar los CID y el id del estudiante
CREATE TABLE Experiments (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ID autoincremental como clave primaria
    id_student INT NOT NULL,            -- ID del estudiante
    id_laboratory INT NOT NULL,         -- ID del laboratorio
    cid VARCHAR(255) NOT NULL,          -- Columna para el CID
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP -- Columna para la fecha con valor por defecto
);

-- Usuario
CREATE USER 'deno'@'localhost' IDENTIFIED BY 'MiBackend';
GRANT ALL PRIVILEGES ON axiom_db.* TO 'deno'@'localhost';

Flush PRIVILEGES;