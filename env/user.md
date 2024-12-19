#crear la bd
CREATE USER 'deno'@'localhost' IDENTIFIED BY 'MiBackend';
GRANT ALL PRIVILEGES ON axiom.* TO 'deno'@'localhost';