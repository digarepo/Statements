CREATE TABLE IF NOT EXISTS Statements (
      dp_id VARCHAR(6) not null PRIMARY KEY,
      amount INT NOT NULL,
      deposit_date datetime DEFAULT NULL
    )