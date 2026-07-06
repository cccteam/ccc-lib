CREATE TABLE PasswordSessions (
  Id STRING(36) NOT NULL,
  Username STRING(MAX) NOT NULL,
  NormalizedUsername STRING(MAX) AS (NORMALIZE_AND_CASEFOLD(Username)) STORED,
  CreatedAt TIMESTAMP NOT NULL OPTIONS (
    allow_commit_timestamp = true
  ),
  UpdatedAt TIMESTAMP OPTIONS (
    allow_commit_timestamp = true
  ),
  Expired BOOL NOT NULL,
  CONSTRAINT CK_PortalSessions_Id CHECK(REGEXP_CONTAINS(Id, r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')),
) PRIMARY KEY(Id), ROW DELETION POLICY (OLDER_THAN(CreatedAt, INTERVAL 30 DAY));
