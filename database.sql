CREATE DATABASE IF NOT EXISTS alianza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alianza;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
CREATE TABLE items ( id INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(100) UNIQUE NOT NULL, descripcion VARCHAR(255), unidad_medida VARCHAR(50), stock DECIMAL(18,2) DEFAULT 0, conteo DECIMAL(18,2) NULL, diferencia DECIMAL(18,2) NULL, estatus ENUM('conciliado','faltante','sobrante') DEFAULT 'conciliado', usuario_modifica VARCHAR(100) NULL, fecha_modificacion DATE NULL, hora_modificacion TIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
INSERT INTO usuarios (username,password_hash,role) VALUES ('admin','$2a$10$D3L/OuE5hHCGTQqF0m6NNe4NdwS2fZp3W2q7wdV3f0Y3QzXwzj2ES','admin');
INSERT INTO items (codigo,descripcion,unidad_medida,stock) VALUES ('A001','Tornillo 1/2"','UND',100),('A002','Tuerca 1/2"','UND',200),('B010','Cable 2m','UND',50);
