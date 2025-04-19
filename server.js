const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    console.log(`Запрос: ${req.method} ${req.url}`);
    next();
});

const frontendPath = path.join(__dirname, 'frontend');
console.log('Путь к папке frontend:', frontendPath); 

app.use(express.static(frontendPath));

const dbConfig = {
    host: 'localhost',
    user: 'root', 
    password: 'Kamilla9291',    
    database: 'university'     
};

app.get('/faculties', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM faculties');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении факультетов');
    }
});
app.get('/students_groups', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM students_groups');
        await connection.end();
        res.status(200).json(rows);
    } catch (err) {
        console.error('Ошибка при получении групп:', err);
        res.status(500).send('Ошибка сервера');
    }
});
app.get('/students', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM students');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при получении студентов');
    }
});
app.get('/schedules', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM schedules');
        console.log('Данные расписания:', rows); 
        await connection.end();

        res.json(rows); 
    } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        res.status(500).send('Ошибка сервера.');
    }
});
app.get('/all-tables', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [studentsGroups] = await connection.execute('SELECT * FROM students_groups');
        const [students] = await connection.execute('SELECT * FROM students');
        const [faculties] = await connection.execute('SELECT * FROM faculties');
        const [schedules] = await connection.execute('SELECT * FROM schedules');
        await connection.end();
        res.status(200).json({
            students_groups: studentsGroups,
            students: students,
            faculties: faculties,
            schedules: schedules,
        });
    } catch (error) {
        console.error('Ошибка при получении данных из всех таблиц:', error);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/students_groups', async (req, res) => {
    try {
        console.log('Данные запроса:', req.body);
        const { group_name, faculty_name } = req.body;
        if (!group_name || !faculty_name) {
            return res.status(400).send('Поля group_name и faculty_name обязательны.');
        }
        const connection = await mysql.createConnection(dbConfig);
        const query = `INSERT INTO students_groups (group_name, faculty_name) VALUES (?, ?)`;
        await connection.execute(query, [group_name, faculty_name]);
        await connection.end();

        res.status(201).send('Группа успешно добавлена!');
    } catch (error) {
        console.error('Ошибка добавления группы:', error);
        res.status(500).send('Ошибка на сервере');
    }
});
app.post('/students', async (req, res) => {
    try {
        console.log('Данные запроса:', req.body); 
        const { first_name, last_name, group_name, admission_year, phone_number } = req.body;

        if (!first_name || !last_name || !group_name || !admission_year || !phone_number) {
            return res.status(400).send('Все поля обязательны.');
        }
        const connection = await mysql.createConnection(dbConfig);
        const query = `
            INSERT INTO students (first_name, last_name, group_name, admission_year, phone_number)
            VALUES (?, ?, ?, ?, ?)
        `;
        await connection.execute(query, [first_name, last_name, group_name, admission_year, phone_number]);
        await connection.end();
        res.status(201).send('Студент успешно добавлен!');
    } catch (error) {
        console.error('Ошибка при добавлении студента:', error); 
        res.status(500).send('Ошибка сервера');
    }
});
app.post('/schedules', async (req, res) => {
    let connection;
    try {
        const { group_name, subject_name, day_of_week, time, classroom } = req.body;

        if (!group_name || !subject_name || !day_of_week || !time || !classroom) {
            return res.status(400).send('Все поля обязательны.');
        }
        connection = await mysql.createConnection(dbConfig);
        const query = `
            INSERT INTO schedules (group_name, subject_name, day_of_week, time, classroom)
            VALUES (?, ?, ?, ?, ?)
        `;
        await connection.execute(query, [group_name, subject_name, day_of_week, time, classroom]);
        console.log('Запись успешно добавлена:', req.body);
        res.status(201).send('Запись успешно добавлена!');
    } catch (error) {
        console.error('Ошибка на сервере:', error);
        res.status(500).send('Ошибка сервера.');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});
app.post('/all-tables', async (req, res) => {
    const { faculties, groups, students, schedules } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (faculties && faculties.length > 0) {
            for (const faculty of faculties) {
                await connection.execute(
                    'INSERT INTO faculties (faculty_name) VALUES (?)',
                    [faculty.faculty_name]
                );
            }
        }
        if (groups && groups.length > 0) {
            for (const group of groups) {
                await connection.execute(
                    'INSERT INTO students_groups (group_name, faculty_name) VALUES (?, ?)',
                    [group.group_name, group.faculty_name]
                );
            }
        }
        if (students && students.length > 0) {
            for (const student of students) {
                await connection.execute(
                    'INSERT INTO students (student_name, enrollment_year, group_name) VALUES (?, ?, ?)',
                    [student.student_name, student.enrollment_year, student.group_name]
                );
            }
        }
        if (schedules && schedules.length > 0) {
            for (const schedule of schedules) {
                await connection.execute(
                    'INSERT INTO schedules (subject, group_name, day, time, room) VALUES (?, ?, ?, ?, ?)',
                    [schedule.subject, schedule.group_name, schedule.day, schedule.time, schedule.room]
                );
            }
        }
        await connection.end();
        res.status(201).send('Данные успешно добавлены во все таблицы!');
    } catch (err) {
        console.error('Ошибка при добавлении данных во все таблицы:', err);
        res.status(500).send('Ошибка при добавлении данных во все таблицы');
    }
});

app.delete('/students_groups/:group_name', async (req, res) => {
    try {
        const groupName = req.params.group_name;
        const connection = await mysql.createConnection(dbConfig);
        const query = `DELETE FROM students_groups WHERE group_name = ?`;
        const [result] = await connection.execute(query, [groupName]);
        await connection.end();
        if (result.affectedRows > 0) {
            console.log(`Группа удалена: ${groupName}`);
            res.status(200).send('Группа успешно удалена!');
        } else {
            res.status(404).send('Группа не найдена');
        }
    } catch (error) {
        console.error('Ошибка при удалении группы:', error);
        res.status(500).send('Ошибка сервера');
    }
});
app.delete('/students/:phone_number', async (req, res) => {
    try {
        const phoneNumber = req.params.phone_number;
        const connection = await mysql.createConnection(dbConfig);
        const query = `DELETE FROM students WHERE phone_number = ?`;
        const [result] = await connection.execute(query, [phoneNumber]);
        await connection.end();
        if (result.affectedRows > 0) {
            console.log(`Студент удалён: ${phoneNumber}`);
            res.status(200).send('Студент успешно удалён!');
        } else {
            res.status(404).send('Студент не найден');
        }
    } catch (error) {
        console.error('Ошибка при удалении студента:', error);
        res.status(500).send('Ошибка сервера');
    }
});
app.delete('/schedules', async (req, res) => {
    try {
        const { group_name, subject_name, day_of_week, time, classroom } = req.body;
        if (!group_name || !subject_name || !day_of_week || !time || !classroom) {
            return res.status(400).send('Все поля обязательны.');
        }
        const connection = await mysql.createConnection(dbConfig);
        const query = `
            DELETE FROM schedules
            WHERE group_name = ? AND subject_name = ? AND day_of_week = ? AND time = ? AND classroom = ?
        `;
        const [result] = await connection.execute(query, [group_name, subject_name, day_of_week, time, classroom]);
        await connection.end();
        if (result.affectedRows > 0) {
            console.log(`Запись удалена: ${group_name}, ${subject_name}, ${day_of_week}, ${time}, ${classroom}`);
            res.status(200).send('Запись успешно удалена!');
        } else {
            res.status(404).send('Запись не найдена.');
        }
    } catch (error) {
        console.error('Ошибка при удалении записи:', error);
        res.status(500).send('Ошибка сервера.');
    }
});

const PORT = 5500
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
