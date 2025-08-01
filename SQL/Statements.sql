CREATE TABLE IF NOT EXISTS statements (
      dp_id VARCHAR(6) not null PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,,
      deposit_date datetime DEFAULT NULL
    )