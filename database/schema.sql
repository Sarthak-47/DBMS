-- ============================================================
-- Evenzo — College Event Management System
-- MySQL 8+ Schema | Course: 21CSC205P — DBMS
-- SRM Institute of Science and Technology
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- CORE TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  user_id       INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(15),
  role          VARCHAR(20)  NOT NULL,
  -- SRM students
  reg_no        VARCHAR(20),
  department    VARCHAR(100),
  year          VARCHAR(20),
  course        VARCHAR(100),
  -- Other-college students
  college_name  VARCHAR(150),
  city          VARCHAR(100),
  -- Organizers / Faculty
  org_type      VARCHAR(50),
  org_role      VARCHAR(50),
  org_name      VARCHAR(150),
  designation   VARCHAR(100),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_role CHECK (role IN ('student','other_student','organizer','admin','faculty'))
);

CREATE TABLE IF NOT EXISTS venues (
  venue_id      INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  building_name VARCHAR(100),
  type          VARCHAR(50),
  capacity      INT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_venue_type CHECK (type IN ('Classroom','Auditorium','Lab','Ground','Seminar Hall','Online','Other'))
);

CREATE TABLE IF NOT EXISTS events (
  event_id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organizer_id          INT,
  venue_id              INT,
  title                 VARCHAR(150) NOT NULL,
  category              VARCHAR(50),
  description           TEXT,
  eligibility           TEXT,
  start_datetime        DATETIME,
  end_datetime          DATETIME,
  registration_deadline DATETIME,
  fee                   DECIMAL(10,2) DEFAULT 0,
  min_team_size         INT           DEFAULT 1,
  max_team_size         INT           DEFAULT 1,
  max_participants      INT,
  upi_id                VARCHAR(100),
  payee_name            VARCHAR(100),
  approval_status       VARCHAR(20)   DEFAULT 'pending',
  event_status          VARCHAR(20)   DEFAULT 'upcoming',
  created_at            DATETIME      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_category        CHECK (category IN ('Hackathon','Workshop','Cultural','Ideathon','Makeathon','Technical','Other')),
  CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending','approved','rejected')),
  CONSTRAINT chk_event_status    CHECK (event_status    IN ('upcoming','ongoing','completed')),
  FOREIGN KEY (organizer_id) REFERENCES users(user_id),
  FOREIGN KEY (venue_id)     REFERENCES venues(venue_id)
);

CREATE TABLE IF NOT EXISTS teams (
  team_id    INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id   INT,
  team_name  VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registrations (
  reg_id        INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id      INT,
  user_id       INT,
  team_id       INT,
  status        VARCHAR(20)  DEFAULT 'registered',
  payment_ref   VARCHAR(100),
  registered_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reg_status CHECK (status IN ('registered','pending','cancelled')),
  FOREIGN KEY (event_id) REFERENCES events(event_id),
  FOREIGN KEY (user_id)  REFERENCES users(user_id),
  FOREIGN KEY (team_id)  REFERENCES teams(team_id)
);

CREATE TABLE IF NOT EXISTS team_members (
  id       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  team_id  INT,
  user_id  INT,
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  cert_id   INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id   INT,
  event_id  INT,
  cert_type VARCHAR(50),
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  pdf_path  VARCHAR(255),
  FOREIGN KEY (user_id)  REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notif_id   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   DEFAULT 0,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ────────────────────────────────────────────────────────────
-- STORED PROCEDURE: register_for_event
-- Handles capacity check, duplicate check, team creation,
-- and conditional pending status for paid events.
-- ────────────────────────────────────────────────────────────

DELIMITER $$

DROP PROCEDURE IF EXISTS register_for_event$$

CREATE PROCEDURE register_for_event(
  IN p_user_id     INT,
  IN p_event_id    INT,
  IN p_team_name   VARCHAR(100),
  IN p_payment_ref VARCHAR(100)
)
BEGIN
  DECLARE v_current_count INT DEFAULT 0;
  DECLARE v_max_part      INT DEFAULT NULL;
  DECLARE v_fee           DECIMAL(10,2) DEFAULT 0;
  DECLARE v_team_id       INT DEFAULT NULL;
  DECLARE v_existing      INT DEFAULT 0;
  DECLARE v_deadline      DATETIME DEFAULT NULL;
  DECLARE v_event_found   INT DEFAULT 0;

  -- Duplicate check
  SELECT COUNT(*) INTO v_existing
  FROM registrations
  WHERE user_id = p_user_id AND event_id = p_event_id AND status != 'cancelled';

  IF v_existing > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You are already registered for this event';
  END IF;

  -- Check event exists and is approved
  SELECT COUNT(*) INTO v_event_found
  FROM events
  WHERE event_id = p_event_id AND approval_status = 'approved';

  IF v_event_found = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event not found or not approved';
  END IF;

  SELECT registration_deadline, max_participants, fee
  INTO   v_deadline, v_max_part, v_fee
  FROM   events
  WHERE  event_id = p_event_id
  LIMIT 1;

  -- Deadline check
  IF v_deadline IS NOT NULL AND NOW() > v_deadline THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration deadline has passed';
  END IF;

  -- Capacity check
  SELECT COUNT(*) INTO v_current_count
  FROM   registrations
  WHERE  event_id = p_event_id AND status = 'registered';

  IF v_max_part IS NOT NULL AND v_current_count >= v_max_part THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event is at full capacity';
  END IF;

  -- Create team if team name provided
  IF p_team_name IS NOT NULL AND TRIM(p_team_name) != '' THEN
    INSERT INTO teams (event_id, team_name)
    VALUES (p_event_id, TRIM(p_team_name));
    SET v_team_id = LAST_INSERT_ID();
  END IF;

  -- Determine status
  SET p_payment_ref = NULLIF(TRIM(COALESCE(p_payment_ref, '')), '');

  -- Insert registration
  INSERT INTO registrations (event_id, user_id, team_id, status, payment_ref)
  VALUES (
    p_event_id,
    p_user_id,
    v_team_id,
    CASE WHEN v_fee > 0 AND p_payment_ref IS NULL THEN 'pending' ELSE 'registered' END,
    p_payment_ref
  );

END$$

-- ────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update event_status on INSERT
-- ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_event_status_insert$$

CREATE TRIGGER trg_event_status_insert
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
  IF NEW.start_datetime IS NOT NULL AND NEW.end_datetime IS NOT NULL THEN
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime >= NOW() THEN
      SET NEW.event_status = 'ongoing';
    ELSEIF NEW.end_datetime < NOW() THEN
      SET NEW.event_status = 'completed';
    ELSE
      SET NEW.event_status = 'upcoming';
    END IF;
  END IF;
END$$

-- ────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update event_status on UPDATE
-- ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_event_status_update$$

CREATE TRIGGER trg_event_status_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
  IF NEW.start_datetime IS NOT NULL AND NEW.end_datetime IS NOT NULL THEN
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime >= NOW() THEN
      SET NEW.event_status = 'ongoing';
    ELSEIF NEW.end_datetime < NOW() THEN
      SET NEW.event_status = 'completed';
    ELSE
      SET NEW.event_status = 'upcoming';
    END IF;
  END IF;
END$$

DELIMITER ;

-- ────────────────────────────────────────────────────────────
-- VIEW: event_summary — convenience view used by listing APIs
-- Note: MySQL does not support FILTER clause; use CASE WHEN.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW event_summary AS
SELECT
  e.event_id,
  e.title,
  e.category,
  e.description,
  e.eligibility,
  e.start_datetime,
  e.end_datetime,
  e.registration_deadline,
  e.fee,
  e.min_team_size,
  e.max_team_size,
  e.max_participants,
  e.upi_id,
  e.payee_name,
  e.approval_status,
  e.event_status,
  e.created_at,
  e.organizer_id,
  u.full_name      AS organizer_name,
  e.venue_id,
  v.name           AS venue_name,
  v.building_name  AS venue_building,
  SUM(CASE WHEN r.status = 'registered' THEN 1 ELSE 0 END) AS confirmed_count
FROM events e
LEFT JOIN users  u ON e.organizer_id = u.user_id
LEFT JOIN venues v ON e.venue_id     = v.venue_id
LEFT JOIN registrations r ON e.event_id = r.event_id
GROUP BY
  e.event_id, e.title, e.category, e.description, e.eligibility,
  e.start_datetime, e.end_datetime, e.registration_deadline,
  e.fee, e.min_team_size, e.max_team_size, e.max_participants,
  e.upi_id, e.payee_name, e.approval_status, e.event_status,
  e.created_at, e.organizer_id, e.venue_id,
  u.full_name, v.name, v.building_name;
