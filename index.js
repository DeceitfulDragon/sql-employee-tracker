require('dotenv').config();
const inquirer = require('inquirer');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

pool.connect();

// View all employees
function viewEmployees() {
    console.log("\n");
    // Query to get and add manager to the employee table
    pool.query(
`SELECT
    emp.id AS employee_id,
    emp.first_name,
    emp.last_name,
    role.title,
    dep.name AS department,
    role.salary,
    CONCAT(mgr.first_name, ' ', mgr.last_name) AS manager_name
FROM
    employee emp
JOIN
    role ON emp.role_id = role.id
JOIN
    department dep ON role.department_id = dep.id
LEFT JOIN
    employee mgr ON emp.manager_id = mgr.id;`, 
    (err, res) => { console.table(res.rows); })

    console.log("\n");
    beginPrompts();
}

// View employees by department
function viewEmployeesByDepartment() {
    // Query to fill the choice list for an inquirer prompt
    pool.query('SELECT id, name FROM department', (err, res) => {
        if (err) { return console.log(err); }

        // Grabbing departments to use as choices in the prompt
        const departments = res.rows.map(department => ({
            name: department.name,
            value: department.id
        }));

        // Prompt to select a department
        inquirer.prompt([{
            type: 'list',
            name: 'departmentId',
            message: 'Select a department:',
            choices: departments
        }]).then((answer) => {
            // Query to get all employees from the selected department
            const sqlQuery = `
            SELECT
                emp.id AS employee_id,
                emp.first_name,
                emp.last_name,
                role.title,
                dep.name AS department,
                role.salary,
                CONCAT(mgr.first_name, ' ', mgr.last_name) AS manager_name
            FROM
                employee emp
            JOIN
                role ON emp.role_id = role.id
            JOIN
                department dep ON role.department_id = dep.id
            LEFT JOIN
                employee mgr ON emp.manager_id = mgr.id
            WHERE
                dep.id = $1
            ORDER BY
                emp.last_name, emp.first_name;
            `;

            pool.query(sqlQuery, [answer.departmentId], (err, res) => {
                if (err) { return console.log(err); }
                console.log("\n");
                console.table(res.rows);
                beginPrompts();
            });
        });
    });
}

// View employees by manager
function viewEmployeesByManager() {
    // Query to populate the choice list for an inquirer prompt with managers
    const managerQuery = `
        SELECT DISTINCT mgr.id, CONCAT(mgr.first_name, ' ', mgr.last_name) AS manager_name
        FROM employee emp
        JOIN employee mgr ON emp.manager_id = mgr.id
        ORDER BY mgr.last_name, mgr.first_name;
    `;

    pool.query(managerQuery, (err, res) => {
        if (err) { return console.log(err); }

        // Extracting managers to use as choices in the prompt
        const managers = res.rows.map(manager => ({
            name: manager.manager_name,
            value: manager.id
        }));

        // Prompt to select a manager
        inquirer.prompt([{
            type: 'list',
            name: 'managerId',
            message: 'Select a manager:',
            choices: managers
        }]).then((answer) => {
            // Query to get all employees under the selected manager
            const sqlQuery = `
                SELECT
                    emp.id AS employee_id,
                    emp.first_name,
                    emp.last_name,
                    role.title,
                    dep.name AS department,
                    role.salary,
                    CONCAT(mgr.first_name, ' ', mgr.last_name) AS manager_name
                FROM
                    employee emp
                JOIN
                    role ON emp.role_id = role.id
                JOIN
                    department dep ON role.department_id = dep.id
                LEFT JOIN
                    employee mgr ON emp.manager_id = mgr.id
                WHERE
                    emp.manager_id = $1
                ORDER BY
                    emp.last_name, emp.first_name;
            `;

            pool.query(sqlQuery, [answer.managerId], (err, res) => {
                if (err) { return console.log(err); }
                console.log("\n");
                console.table(res.rows);
                beginPrompts();
            });
        });
    });
}
// View all roles
function viewRoles() {
    let query = `
        SELECT role.id, role.title, department.name AS department, role.salary
        FROM role
        JOIN department ON role.department_id = department.id
        ORDER BY role.id;
    `;
    pool.query(query, (err, res) => {
        if (err) { return console.log(err); }
        console.table(res.rows);
        beginPrompts();
    });
}

// Add a role
function addRole() {
    pool.query('SELECT id, name FROM department', (err, results) => {
        if (err) { return console.log(err); }
        const departments = results.rows.map(dep => ({
            name: dep.name,
            value: dep.id
        }));
        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of the role:'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for the role:'
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select the department:',
                choices: departments
            }
        ]).then(answers => {
            const sqlQuery = 'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)';
            pool.query(sqlQuery, [answers.title, answers.salary, answers.departmentId], (err, res) => {
                if (err) { return console.log(err); }
                console.log("New role added!");
                beginPrompts();
            });
        });
    });
}
// Add a department
function addDepartment() {
    inquirer.prompt({
        type: 'input',
        name: 'departmentName',
        message: 'Enter the name of the new department:'

    }).then(answer => {
        const sqlQuery = 'INSERT INTO department (name) VALUES ($1)';
        pool.query(sqlQuery, [answer.departmentName], (err, res) => {
            if (err) { return console.log(err); }

            console.log("New department added!");
            beginPrompts();
        });
    });
}

// Delete a department
function deleteDepartment() {
    pool.query('SELECT id, name FROM department', (err, results) => {
        if (err) { return console.log(err); }
        const departmentChoices = results.rows.map(dep => ({
            name: dep.name,
            value: dep.id
        }));

        inquirer.prompt({
            type: 'list',
            name: 'departmentId',
            message: 'Select a department to delete:',
            choices: departmentChoices
        }).then(answer => {
            const sqlQuery = 'DELETE FROM department WHERE id = $1';
            pool.query(sqlQuery, [answer.departmentId], (err, res) => {
                if (err) { return console.log(err); }
                console.log("Department deleted!");
                beginPrompts();
            });
        });
    });
}


function beginPrompts() {
    // Inquirer Prompts
    inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'Select an action to perform:',
        choices: [
            { name: "View employees", value: "VIEW_ALL" },
            { name: "View employees by department", value: "VIEW_DEP" },
            { name: "View employees by manager", value: "VIEW_MGR" },
            { name: "View total budget by department", value: "VIEW_BUDGET" },
            { name: "View all roles", value: "VIEW_ROLES" },
            { name: "Add new role", value: "ADD_ROLE" },
            { name: "Add new department", value: "ADD_DEP" },
            { name: "Update employee manager", value: "UPDATE_MANAGER" },
            { name: "Delete a department", value: "DELETE_DEP" },
            { name: "Exit application", value: "EXIT" }
        ]
    }]).then((answers) => {
        console.log(answers);
        // Switch statement for whatever user chooses
        switch (answers.choice) {
            case "VIEW_ALL":
                viewEmployees();
                break;
            case "VIEW_DEP":
                viewEmployeesByDepartment();
                break;
            case "VIEW_MGR":
                viewEmployeesByManager();
                break;
            case "VIEW_ROLES":
                viewRoles();
                break;
            case "ADD_ROLE":
                addRole()
                break;
            case "ADD_DEP":
                addDepartment();
                break;
            default:
                exit();
                break;
        }
        
    })
}
// Exit function
function exit() {
    console.log("Exiting the application...");
    process.exit();
}

// Initialize
function init() {
    console.log("Thank you for using EMPLOYEE MANAGEMENT SYSTEM 3000! Brought to you by BERKELEY BROTHERS LLC!");
    beginPrompts();
}

init();