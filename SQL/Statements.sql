CREATE TABLE IF NOT EXISTS statements (
      dp_id VARCHAR(6) not null PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      deposit_date datetime DEFAULT NULL
      owner_name VARCHAR(100) NOT NULL,
      depositor_name VARCHAR(100) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      reconciliation VARCHAR(20) NOT NULL,
      ref_number VARCHAR(50) NOT NULL, 
      deposit_number VARCHAR(50) NOT NULL,
      account_type VARCHAR(50) NOT NULL,
      comment VARCHAR(100) NOT NULL,
    )