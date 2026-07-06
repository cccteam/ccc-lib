CREATE TABLE SessionUsers (
  Id STRING(36) NOT NULL,
  Username STRING(MAX) NOT NULL,
  NormalizedUsername STRING(MAX) AS (NORMALIZE_AND_CASEFOLD(Username)) STORED,
  PasswordHash STRING(MAX),
  Disabled BOOL NOT NULL DEFAULT (FALSE),
  SearchTokens TOKENLIST AS (TOKENIZE_SUBSTRING(Username)) HIDDEN,
  CONSTRAINT CK_SessionUsersId CHECK(REGEXP_CONTAINS(Id, r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')),
) PRIMARY KEY(Id);

-- -- All test users have password: password (argon2ID hashed)
-- INSERT INTO SessionUsers (Id, Username, PasswordHash, Disabled) VALUES
-- ('af669ce5-0c56-4dd8-8578-25bb75f39da4', 'blaine@cloud-team.com', '1$12288$3$1$oGwawstCMOWozw2vbJgyyQ==.TwIukshFIMhe8brmzjO21FBjB/OeMiHHEEVVVRliDIc=', FALSE)
