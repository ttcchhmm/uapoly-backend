-- Default users. Passwords are "password"
INSERT INTO account VALUES
    ('tchm', '$2b$10$eW8pd7jAQq/fE/6XLg.RnOB9i.3rZzj60gHe6dK.O58bjuT0SGK8G', 'tchm@example.org'),
    ('TestUser1', '$2b$10$oPpMvjBiNQcUKKBoUY05W.v3.lXO3PlwS7IR8IbLXcRZGQqM9V6i.', 'testuser1@example.org');

-- Default friend lists
INSERT INTO friend VALUES
    ('tchm', 'TestUser1', TRUE);