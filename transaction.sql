 CREATE TABLE transactions (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id INT NOT NULL,
     order_id VARCHAR(255) NOT NULL,
     amount DECIMAL(10,2) NOT NULL,
     record_count INT NOT NULL,
     status VARCHAR(50) NOT NULL,
     payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     csv_data LONGTEXT,
     FOREIGN KEY (user_id) REFERENCES users(id)
 );