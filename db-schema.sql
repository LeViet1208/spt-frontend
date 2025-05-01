-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Data imports table
CREATE TABLE data_imports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  import_type ENUM('sales', 'inventory', 'customers', 'products') NOT NULL,
  record_count INT NOT NULL,
  status ENUM('Completed', 'Failed', 'Processing') DEFAULT 'Completed',
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sales table
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  customer_id VARCHAR(50),
  created_at DATETIME NOT NULL,
  FOREIGN KEY (import_id) REFERENCES data_imports(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Inventory table
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_id INT NOT NULL,
  user_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (import_id) REFERENCES data_imports(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Customers table
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_id INT NOT NULL,
  user_id INT NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (import_id) REFERENCES data_imports(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_data_imports_user_id ON data_imports(user_id);
