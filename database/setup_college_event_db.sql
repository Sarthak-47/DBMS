-- ============================================================
-- college_event_db — Complete Setup + Evenzo App Supplements
-- SRM Institute of Science and Technology | 21CSC205P DBMS
-- ============================================================

DROP DATABASE IF EXISTS college_event_db;
CREATE DATABASE college_event_db;
USE college_event_db;

-- ── Core tables (from college_event_db.sql) ─────────────────

CREATE TABLE USER (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME NULL
);

CREATE TABLE USER_PHONE (
    phone_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE EMAIL_OTP (
    otp_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE STUDENT (
    student_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE SRM_STUDENT (
    srm_student_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL UNIQUE,
    reg_no VARCHAR(50) NOT NULL UNIQUE,
    year INT NOT NULL,
    course VARCHAR(100) NOT NULL,
    department VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
);

CREATE TABLE COLLEGE (
    college_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    college_name VARCHAR(255) NOT NULL UNIQUE,
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100)
);

CREATE TABLE NON_SRM_STUDENT (
    non_srm_student_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL UNIQUE,
    college_id BIGINT NOT NULL,
    course VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (college_id) REFERENCES COLLEGE(college_id)
);

CREATE TABLE FACULTY (
    faculty_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE ADMIN (
    admin_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE CLUB_OR_DEPARTMENT (
    organizer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organizer_type ENUM('Club','Department') NOT NULL,
    organizer_name VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE VENUE (
    venue_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    building_name VARCHAR(255) NOT NULL,
    floor VARCHAR(50),
    room_no VARCHAR(50),
    venue_name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    type ENUM('Auditorium','Lab','Classroom','Ground','Online') NOT NULL
);

CREATE TABLE EVENT (
    event_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Ideathon','Hackathon','Makeathon','Workshop','Cultural','Technical','Other') NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    reg_last_date DATETIME NOT NULL,
    reg_fee DECIMAL(10,2) DEFAULT 0,
    min_team_size INT DEFAULT 1,
    max_team_size INT DEFAULT 1,
    max_participants INT NOT NULL,
    eligibility TEXT NOT NULL,
    registration_link VARCHAR(500) NOT NULL DEFAULT 'platform',
    upi_id VARCHAR(100),
    payee_name VARCHAR(100),
    approval_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    event_status ENUM('Upcoming','Ongoing','Completed','Archived') DEFAULT 'Upcoming',
    venue_id BIGINT NOT NULL,
    organizer_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    approved_by_admin_id BIGINT,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES VENUE(venue_id),
    FOREIGN KEY (organizer_id) REFERENCES CLUB_OR_DEPARTMENT(organizer_id),
    FOREIGN KEY (created_by_user_id) REFERENCES USER(user_id),
    FOREIGN KEY (approved_by_admin_id) REFERENCES ADMIN(admin_id)
);

CREATE TABLE TEAM (
    team_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id BIGINT NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_size INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id),
    UNIQUE(event_id, team_name)
);

CREATE TABLE REGISTRATION (
    registration_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    team_id BIGINT,
    registration_status ENUM('Pending','Registered','Cancelled') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (team_id) REFERENCES TEAM(team_id),
    UNIQUE(event_id, student_id)
);

CREATE TABLE PAYMENT (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    registration_id BIGINT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_reference VARCHAR(150) NOT NULL UNIQUE,
    payment_status ENUM('Pending','Success','Failed') DEFAULT 'Pending',
    paid_at DATETIME,
    FOREIGN KEY (registration_id) REFERENCES REGISTRATION(registration_id)
);

-- ── Evenzo App Supplementary Tables ─────────────────────────

-- Links faculty/organizer users to CLUB_OR_DEPARTMENT entities
CREATE TABLE ORGANIZER_MEMBERS (
    organizer_member_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organizer_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    member_role ENUM('ClubHead','DeptHead','Coordinator','Member') NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES CLUB_OR_DEPARTMENT(organizer_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id),
    UNIQUE(organizer_id, user_id)
);

-- Team members (for multi-member team events)
CREATE TABLE TEAM_MEMBER (
    team_member_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    team_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES TEAM(team_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    UNIQUE(team_id, student_id)
);

-- In-app notifications
CREATE TABLE NOTIFICATIONS (
    notif_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

-- Participation certificates
CREATE TABLE CERTIFICATES (
    cert_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    cert_type VARCHAR(50),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    pdf_path VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES USER(user_id),
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id)
);

-- ── Triggers ─────────────────────────────────────────────────

DELIMITER $$

CREATE TRIGGER trg_event_status_insert
BEFORE INSERT ON EVENT
FOR EACH ROW
BEGIN
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime >= NOW() THEN
        SET NEW.event_status = 'Ongoing';
    ELSEIF NEW.end_datetime < NOW() THEN
        SET NEW.event_status = 'Archived';
    ELSE
        SET NEW.event_status = 'Upcoming';
    END IF;
END$$

CREATE TRIGGER trg_event_status_update
BEFORE UPDATE ON EVENT
FOR EACH ROW
BEGIN
    IF NEW.start_datetime <= NOW() AND NEW.end_datetime >= NOW() THEN
        SET NEW.event_status = 'Ongoing';
    ELSEIF NEW.end_datetime < NOW() THEN
        SET NEW.event_status = 'Archived';
    ELSE
        SET NEW.event_status = 'Upcoming';
    END IF;
END$$

CREATE TRIGGER trg_team_size_on_add
AFTER INSERT ON TEAM_MEMBER
FOR EACH ROW
BEGIN
    UPDATE TEAM
    SET team_size = (SELECT COUNT(*) FROM TEAM_MEMBER WHERE team_id = NEW.team_id)
    WHERE team_id = NEW.team_id;
END$$

CREATE TRIGGER trg_registration_on_payment
AFTER INSERT ON PAYMENT
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'Success' THEN
        UPDATE REGISTRATION
        SET registration_status = 'Registered'
        WHERE registration_id = NEW.registration_id;
    END IF;
END$$

DELIMITER ;

-- ── Stored Procedure: register_for_event ─────────────────────

DELIMITER $$

CREATE PROCEDURE register_for_event(
    IN p_user_id    BIGINT,
    IN p_event_id   BIGINT,
    IN p_team_name  VARCHAR(255),
    IN p_payment_ref VARCHAR(150)
)
BEGIN
    DECLARE v_student_id   BIGINT DEFAULT NULL;
    DECLARE v_current_count INT   DEFAULT 0;
    DECLARE v_max_part     INT    DEFAULT NULL;
    DECLARE v_reg_fee      DECIMAL(10,2) DEFAULT 0;
    DECLARE v_team_id      BIGINT DEFAULT NULL;
    DECLARE v_existing     INT    DEFAULT 0;
    DECLARE v_deadline     DATETIME DEFAULT NULL;
    DECLARE v_event_found  INT    DEFAULT 0;
    DECLARE v_reg_id       BIGINT DEFAULT NULL;

    -- Resolve student_id from user_id
    SELECT student_id INTO v_student_id FROM STUDENT WHERE user_id = p_user_id;
    IF v_student_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only students can register for events';
    END IF;

    -- Duplicate check
    SELECT COUNT(*) INTO v_existing FROM REGISTRATION
    WHERE student_id = v_student_id AND event_id = p_event_id
      AND registration_status != 'Cancelled';
    IF v_existing > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You are already registered for this event';
    END IF;

    -- Event must exist and be approved
    SELECT COUNT(*) INTO v_event_found FROM EVENT
    WHERE event_id = p_event_id AND approval_status = 'Approved';
    IF v_event_found = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event not found or not yet approved';
    END IF;

    SELECT reg_last_date, max_participants, reg_fee
    INTO   v_deadline, v_max_part, v_reg_fee
    FROM   EVENT WHERE event_id = p_event_id LIMIT 1;

    -- Deadline check
    IF v_deadline IS NOT NULL AND NOW() > v_deadline THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration deadline has passed';
    END IF;

    -- Capacity check
    SELECT COUNT(*) INTO v_current_count FROM REGISTRATION
    WHERE event_id = p_event_id AND registration_status = 'Registered';
    IF v_max_part IS NOT NULL AND v_current_count >= v_max_part THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event is at full capacity';
    END IF;

    -- Create team if name given
    IF p_team_name IS NOT NULL AND TRIM(p_team_name) != '' THEN
        INSERT INTO TEAM (event_id, team_name) VALUES (p_event_id, TRIM(p_team_name));
        SET v_team_id = LAST_INSERT_ID();
    END IF;

    -- Insert registration
    INSERT INTO REGISTRATION (event_id, student_id, team_id, registration_status)
    VALUES (
        p_event_id,
        v_student_id,
        v_team_id,
        CASE
            WHEN v_reg_fee > 0 AND (p_payment_ref IS NULL OR TRIM(p_payment_ref) = '')
            THEN 'Pending'
            ELSE 'Registered'
        END
    );
    SET v_reg_id = LAST_INSERT_ID();

    -- Record payment if reference given
    IF v_reg_fee > 0 AND p_payment_ref IS NOT NULL AND TRIM(p_payment_ref) != '' THEN
        INSERT INTO PAYMENT (registration_id, amount, transaction_reference, payment_status, paid_at)
        VALUES (v_reg_id, v_reg_fee, TRIM(p_payment_ref), 'Success', NOW());
    END IF;
END$$

DELIMITER ;

-- ── View: event_summary ──────────────────────────────────────

CREATE OR REPLACE VIEW event_summary AS
SELECT
    e.event_id,
    e.title,
    e.category,
    e.description,
    e.eligibility,
    e.start_datetime,
    e.end_datetime,
    e.reg_last_date,
    e.reg_last_date                AS registration_deadline,
    e.reg_fee,
    e.reg_fee                      AS fee,
    e.upi_id,
    e.payee_name,
    e.min_team_size,
    e.max_team_size,
    e.max_participants,
    e.registration_link,
    e.approval_status,
    e.event_status,
    e.created_at,
    e.created_by_user_id,
    e.organizer_id,
    cod.organizer_name,
    cod.organizer_type,
    e.venue_id,
    v.venue_name,
    v.venue_name                   AS name,
    v.building_name                AS venue_building,
    v.type                         AS venue_type,
    v.capacity                     AS venue_capacity,
    SUM(CASE WHEN r.registration_status IN ('Registered','Pending') THEN 1 ELSE 0 END) AS confirmed_count
FROM EVENT e
LEFT JOIN CLUB_OR_DEPARTMENT cod ON e.organizer_id = cod.organizer_id
LEFT JOIN VENUE v               ON e.venue_id = v.venue_id
LEFT JOIN REGISTRATION r        ON e.event_id = r.event_id
GROUP BY
    e.event_id, e.title, e.category, e.description, e.eligibility,
    e.start_datetime, e.end_datetime, e.reg_last_date, e.reg_fee,
    e.upi_id, e.payee_name, e.min_team_size, e.max_team_size, e.max_participants,
    e.registration_link, e.approval_status, e.event_status, e.created_at,
    e.created_by_user_id, e.organizer_id,
    cod.organizer_name, cod.organizer_type,
    e.venue_id, v.venue_name, v.building_name, v.type, v.capacity;

-- ── Seed Data ────────────────────────────────────────────────
-- Password for all demo accounts: password123
-- bcrypt hash generated offline (passlib bcrypt)

SET @pw = '$2b$12$RAWx9qLKb8ZBe.VlJH8E6O5PDXwj27.qToQ4JwxbOi1tDIBHiA5ce';

-- Users
INSERT INTO USER (email, password_hash, email_verified, verified_at) VALUES
('arjun@srmist.edu.in',   @pw, TRUE, NOW()),
('ramesh@srmist.edu.in',  @pw, TRUE, NOW()),
('vartika@srmist.edu.in', @pw, TRUE, NOW()),
('priya@srmist.edu.in',   @pw, TRUE, NOW()),
('suresh@srmist.edu.in',  @pw, TRUE, NOW());

-- Phones
INSERT INTO USER_PHONE (user_id, phone) VALUES
(1,'9876543210'),(2,'9876543211'),(3,'9876543212'),(4,'9876543213'),(5,'9876543214');

-- Admin (Vartika)
INSERT INTO ADMIN (user_id) VALUES (3);

-- Faculty (Dr. Suresh)
INSERT INTO FACULTY (user_id, full_name, department, designation) VALUES
(5, 'Dr. Suresh Nair', 'CSE', 'Associate Professor');

-- Students
INSERT INTO STUDENT (user_id, full_name) VALUES
(1, 'Arjun Sharma'),
(4, 'Priya Menon');

-- SRM Students
INSERT INTO SRM_STUDENT (student_id, reg_no, year, course, department) VALUES
(1, 'RA2211003010001', 3, 'B.Tech', 'CSE'),
(2, 'RA2211003010002', 2, 'B.Tech', 'ECE');

-- Organizer club
INSERT INTO CLUB_OR_DEPARTMENT (organizer_type, organizer_name) VALUES
('Club', 'Robotics Club SRM'),
('Department', 'Administration');

-- Ramesh as club head
INSERT INTO USER_PHONE (user_id, phone) VALUES (2,'9876543211');
-- Ramesh is an organizer but not faculty or student — we treat him as faculty for the app
INSERT INTO FACULTY (user_id, full_name, department, designation) VALUES
(2, 'Ramesh Kumar', 'CSE', 'Club Head');
INSERT INTO ORGANIZER_MEMBERS (organizer_id, user_id, member_role) VALUES
(1, 2, 'ClubHead');

-- Venues
INSERT INTO VENUE (building_name, floor, room_no, venue_name, capacity, type) VALUES
('Block 1',        'G', 'Lab 1',  'Tech Hub',        180, 'Lab'),
('Central Block',  '1', 'A101',   'Main Auditorium',  500, 'Auditorium'),
('Block 3',        '2', 'SR-1',   'Seminar Hall A',    60, 'Lab'),
('Campus Grounds', '-', '-',      'Open Ground',      1000,'Ground');

-- Events (organizer_id=1 = Robotics Club, created_by=2 = Ramesh, admin_id for admin-approved uses 3→ADMIN.admin_id=1)
INSERT INTO EVENT
    (title, description, category, start_datetime, end_datetime, reg_last_date,
     reg_fee, min_team_size, max_team_size, max_participants, eligibility,
     registration_link, approval_status, venue_id, organizer_id, created_by_user_id)
VALUES
('HackSRM 5.0',
 "SRM's flagship 36-hour hackathon. Build innovative solutions across HealthTech, FinTech, EdTech, and Open Innovation. Top teams compete for ₹5L+ prize pool.",
 'Hackathon', '2027-04-22 09:00:00', '2027-04-24 17:00:00', '2027-04-20 23:59:00',
 0, 3, 5, 180, 'All SRM students', 'platform', 'Approved', 1, 1, 2),

('Riviera 2025',
 "SRM's iconic cultural extravaganza — dance, music, drama, art installations, and celebrity performances across 3 unforgettable days.",
 'Cultural', '2027-04-28 10:00:00', '2027-04-30 22:00:00', '2027-04-26 23:59:00',
 0, 1, 1, 500, 'Open to all', 'platform', 'Approved', 2, 1, 2),

('ML Bootcamp',
 'Intensive 2-day hands-on workshop on Machine Learning fundamentals, model building, and deployment using Python, scikit-learn, and TensorFlow.',
 'Workshop', '2027-05-05 09:00:00', '2027-05-06 17:00:00', '2027-05-03 23:59:00',
 199, 1, 1, 60, 'All SRM students', 'platform', 'Approved', 3, 1, 2),

('DSA Quiz Open',
 'Test your Data Structures & Algorithms knowledge in this timed quiz championship. Three rounds of escalating difficulty.',
 'Technical', '2027-05-10 14:00:00', '2027-05-10 17:00:00', '2027-05-08 23:59:00',
 0, 1, 1, 200, 'Open to all', 'platform', 'Approved', 3, 1, 2);

-- Update upi for ML Bootcamp
UPDATE EVENT SET upi_id='mlbootcamp@srmist', payee_name='Robotics Club SRM' WHERE title='ML Bootcamp';

-- Registrations (Arjun=student_id 1 → HackSRM event_id 1, and DSA Quiz event_id 4)
CALL register_for_event(1, 1, 'Team Nexus', NULL);
CALL register_for_event(1, 4, NULL, NULL);

-- Notifications
INSERT INTO NOTIFICATIONS (user_id, message) VALUES
(1, 'Welcome to Evenzo! You are registered for HackSRM 5.0.'),
(2, "Your event 'HackSRM 5.0' has been approved.");
