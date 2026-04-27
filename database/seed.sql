-- Evenzo Seed Data
-- Run after schema.sql

-- Users (password: "password123" hashed with bcrypt)
INSERT INTO users (name, email, password_hash, role, department, reg_no, year) VALUES
('Admin User',        'admin@srmist.edu.in',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin',     'Administration',                         NULL,               NULL),
('Arjun Nair',        'arjun@srmist.edu.in',        '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student',   'Computer Science',                       'RA2411026010101',  2),
('Priya Sharma',      'priya@srmist.edu.in',         '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student',   'Electronics',                            'RA2411026010102',  2),
('Rahul Verma',       'rahul@srmist.edu.in',         '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student',   'Mechanical',                             'RA2411026010103',  3),
('Ananya Reddy',      'ananya@srmist.edu.in',        '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student',   'AI & Machine Learning',                  'RA2411026010218',  2),
('Sarthak Singh',     'sarthak@srmist.edu.in',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student',   'AI & Machine Learning',                  'RA2411026010218',  2),
('Vartika Jamwal',    'vartika@srmist.edu.in',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'organiser', 'Computer Science',                       'RA2411026010237',  2),
('Dr. S. Aruna',      'aruna.faculty@srmist.edu.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'faculty',   'Computational Intelligence',             NULL,               NULL),
('Karthik Kumar',     'karthik@srmist.edu.in',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'organiser', 'Computer Science',                       'RA2411026010205',  3),
('Divya Menon',       'divya@srmist.edu.in',         '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student',   'Information Technology',                 'RA2411026010210',  2);

-- Venues
INSERT INTO venues (venue_name, building_name, floor, room_no, venue_type, capacity) VALUES
('Tech Park Auditorium',  'Tech Park',     'Ground Floor', 'Main Hall', 'Auditorium', 2000),
('Lab Block 5 - Room 501','Lab Block 5',   '5th Floor',    '501',       'Lab',         80),
('Seminar Hall C',        'Block C',       '1st Floor',    'SH-01',     'Classroom',  200),
('Open Air Theatre',      'Arts Block',    'Ground Floor', 'OAT',       'Ground',    5000),
('TP502',                 'Tech Park',     '5th Floor',    '502',       'Lab',         60),
('Online',                NULL,            NULL,           NULL,        'Online',    9999);

-- Clubs
INSERT INTO clubs (name, description, organiser_id, faculty_advisor_id, verified) VALUES
('HackSRM',      'SRM''s flagship hackathon and technical innovation club',    7, 8, TRUE),
('Riviera',      'SRM''s annual cultural and arts festival organizing committee', 9, 8, TRUE),
('Catalyst',     'AI/ML research and development club at SRM',                7, 8, TRUE);

-- Events
INSERT INTO events (club_id, name, description, category, venue, start_date, end_date, reg_deadline, capacity, team_min, team_max, prize_pool, reg_fee, eligibility, status, approval_status, created_by) VALUES
(1, 'HackSRM 5.0',
 'SRM''s largest 36-hour hackathon. Build innovative solutions across tracks: HealthTech, FinTech, EdTech, and Open Innovation. Top teams compete for ₹5L+ prize pool.',
 'Hackathon', 'University Auditorium, Tech Park',
 '2025-04-22 09:00:00', '2025-04-24 21:00:00', '2025-04-20 23:59:00',
 500, 2, 4, 500000.00, 0, 'All SRM students (B.Tech / M.Tech)', 'open', 'approved', 7),

(2, 'Riviera 2025',
 'SRM''s iconic cultural extravaganza. Dance, music, drama, art installations, celebrity performances and much more across 3 unforgettable days.',
 'Cultural', 'Open Air Theatre & Main Auditorium',
 '2025-04-28 10:00:00', '2025-04-30 22:00:00', '2025-04-25 23:59:00',
 2000, 1, 1, 100000.00, 50, 'All students', 'open', 'approved', 9),

(3, 'ML Bootcamp',
 'Intensive 2-day hands-on workshop on Machine Learning fundamentals, model building, and deployment. Covers Python, scikit-learn, TensorFlow basics.',
 'Workshop', 'Lab Block 5 - Room 501',
 '2025-05-05 09:00:00', '2025-05-06 17:00:00', '2025-05-03 23:59:00',
 80, 1, 1, 0, 0, 'CS/IT students with basic Python knowledge', 'open', 'approved', 7),

(1, 'DSA Quiz Open',
 'Test your Data Structures & Algorithms knowledge in this timed quiz championship. Individual participation, 3 rounds of escalating difficulty.',
 'Technical', 'Online (LeetCode + Custom Platform)',
 '2025-05-10 14:00:00', '2025-05-10 17:00:00', '2025-05-09 23:59:00',
 300, 1, 1, 25000.00, 0, 'All students', 'open', 'approved', 7),

(3, 'AI Paper Presentation',
 'Present your research on Artificial Intelligence, ML, Deep Learning, or NLP. Best papers will be recommended for publication.',
 'Technical', 'Seminar Hall - Block C',
 '2025-05-15 09:00:00', '2025-05-15 18:00:00', '2025-05-12 23:59:00',
 60, 1, 2, 15000.00, 0, 'UG/PG students', 'open', 'approved', 9);

-- Sample Registrations
INSERT INTO registrations (event_id, user_id, team_name, status) VALUES
(1, 2, 'Team Alpha',    'confirmed'),
(1, 3, 'Team Beta',     'confirmed'),
(1, 4, 'Team Alpha',    'confirmed'),
(2, 2, NULL,            'confirmed'),
(2, 5, NULL,            'confirmed'),
(3, 3, NULL,            'confirmed'),
(4, 4, NULL,            'confirmed'),
(4, 5, NULL,            'confirmed');

-- Notifications
INSERT INTO notifications (user_id, message) VALUES
(2, 'You have successfully registered for "HackSRM 5.0".'),
(2, 'You have successfully registered for "Riviera 2025".'),
(3, 'You have successfully registered for "HackSRM 5.0".'),
(5, 'You have successfully registered for "Riviera 2025".'),
(5, 'You have successfully registered for "DSA Quiz Open".'),
(7, 'Your event "HackSRM 5.0" has been approved and is now live!'),
(9, 'Your event "Riviera 2025" has been approved and is now live!');

-- Certificates (for completed attendance)
INSERT INTO certificates (user_id, event_id, cert_type, pdf_path) VALUES
(2, 3, 'participation', '/certs/cert_2_3.pdf'),
(3, 3, 'participation', '/certs/cert_3_3.pdf');
