\c employees_db

INSERT INTO department (name)
VALUES 
('Marketing'),
('Human Resources'),
('House Keeping'),
('Front Office'),
('Food and Beverage Services');

INSERT INTO role (title, salary, department_id)
VALUES
('Sales Person', 60000, 1),
('Intermediate Sales Person', 70000, 1),
('Sales Lead', 80000, 1),
('HR Lead', 80000, 2),
('Maid', 35000, 3),
('Attendant', 65000, 4),
('Paid Intern', 1000, 4),
('Restocker', 55000, 5);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
('Jacob', 'Jackson', 1, 3),
('Jeremy', 'Jessup', 2, 3),
('Jennifer', 'Jackston', 3, NULL),
('Joseph', 'Jacobson', 4, NULL),
('Jake', 'Jillen', 5, NULL),
('Jill', 'Jackson', 6, NULL),
('Jack', 'Jackson', 7, 6),
('Jeb', 'Jessup', 8, NULL);