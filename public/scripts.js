const API_URL = 'http://localhost:5500';
const output = document.getElementById('output');

const state = {
    groups: false,
    students: false,
    schedules: false,
    allTables: false
};

const toggleData = async (endpoint) => {
    const sectionKey = endpoint.replace(/-/g, '');

    if (state[sectionKey]) {
        output.innerHTML = '';
        state[sectionKey] = false;
    } else {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`);
            const data = await response.json();
            displayData(data);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
        state[sectionKey] = true;
    }
};

const sendPostRequest = async (url, data, responseElement, endpointToReload) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        responseElement.innerHTML = `<p style="color: green;">Успешно добавлено: ${JSON.stringify(responseData)}</p>`;

        if (endpointToReload) {
            state[endpointToReload] = false;
            toggleData(endpointToReload);
        }
    } catch (error) {
        responseElement.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
        console.error('Ошибка при отправке POST-запроса:', error);
    }
};

const displayData = (data) => {
    output.innerHTML = '';
    if (Array.isArray(data)) {
        createTable(data, 'Результаты');
    } else if (typeof data === 'object') {
        Object.keys(data).forEach((key) => {
            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = key;
            output.appendChild(sectionTitle);
            const sectionData = data[key];
            if (Array.isArray(sectionData)) {
                createTable(sectionData, key);
            } else {
                const paragraph = document.createElement('p');
                paragraph.textContent = `Нет данных для ${key}`;
                output.appendChild(paragraph);
            }
        });
    } else {
        output.textContent = `Данные: ${data}`;
    }
};

const createTable = (data, title) => {
    const table = document.createElement('table');
    table.border = '1';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.marginTop = '20px';

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach((header) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.padding = '8px';
        th.style.backgroundColor = '#007bff';
        th.style.color = 'white';
        th.style.textAlign = 'center';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    data.forEach((row) => {
        const tr = document.createElement('tr');
        headers.forEach((header) => {
            const td = document.createElement('td');
            td.textContent = row[header];
            td.style.padding = '8px';
            td.style.textAlign = 'center';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    output.appendChild(table);
};

async function addGroup(groupName, facultyName) {
    try {
        const response = await fetch(`${API_URL}/students_groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ group_name: groupName, faculty_name: facultyName }),
        });

        if (response.ok) {
            console.log('Группа успешно добавлена!');
            await updateTable();
            return { success: true, message: 'Группа успешно добавлена!' };
        } else {
            const errorText = await response.text();
            return { success: false, message: errorText };
        }
    } catch (error) {
        return { success: false, message: 'Ошибка подключения к серверу' };
    }
}
async function updateGroupsTable() {
    const output = document.getElementById('output'); 

    try {
        const response = await fetch(`${API_URL}/students_groups`);
        const groups = await response.json();

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Название группы</th>
                    <th>Факультет</th>
                </tr>
            </thead>
            <tbody>
                ${groups.map(group => `
                    <tr>
                        <td>${group.group_name}</td>
                        <td>${group.faculty_name}</td>
                        <td>
                            <span class="deleteIcon" data-group="${group.group_name}">🗑️</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        output.innerHTML = ''; 
        output.appendChild(table);

        document.querySelectorAll('.deleteIcon').forEach(icon => {
            icon.addEventListener('click', async (event) => {
                const groupName = event.target.getAttribute('data-group');
                await deleteGroup(groupName);
                await updateGroupsTable(); 
            });
        });
    } catch (error) {
        console.error('Ошибка при загрузке таблицы групп:', error);
    }
}
async function deleteGroup(groupName) {
    try {
        const response = await fetch(`${API_URL}/students_groups/${groupName}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Группа успешно удалена:', groupName);

            document.getElementById('groupsBtn').click();
        } else {
            const errorText = await response.text();
            console.error('Ошибка при удалении группы:', errorText);
        }
    } catch (error) {
        console.error('Ошибка подключения к серверу:', error);
    }
}
document.getElementById('addGroupForm').addEventListener('submit', async (event) => {
    event.preventDefault(); 

    const groupName = document.getElementById('groupName').value; 
    const facultyName = document.getElementById('facultyName').value; 
    const studentResponseElement = document.getElementById('groupResponse'); 

    if (!groupName || !facultyName) {
        studentResponseElement.innerText = 'Введите название группы и факультета.';
        studentResponseElement.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/students_groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ group_name: groupName, faculty_name: facultyName }),
        });

        if (response.ok) {
            studentResponseElement.innerText = 'Группа успешно добавлена!';
            studentResponseElement.style.color = 'green';

            await updateGroupsTable();
        } else {
            const errorText = await response.text();
            studentResponseElement.innerText = `Ошибка: ${errorText}`;
            studentResponseElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Ошибка при добавлении группы:', error);
        studentResponseElement.innerText = 'Ошибка подключения к серверу.';
        studentResponseElement.style.color = 'red';
    }
});

async function updateStudentsTable() {
    const output = document.getElementById('output');

    try {
        const response = await fetch(`${API_URL}/students`);
        const students = await response.json();

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Имя</th>
                    <th>Фамилия</th>
                    <th>Группа</th>
                    <th>Год поступления</th>
                    <th>Номер телефона</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(student => `
                    <tr>
                        <td>${student.first_name}</td>
                        <td>${student.last_name}</td>
                        <td>${student.group_name}</td>
                        <td>${student.admission_year}</td>
                        <td>${student.phone_number}</td>
                        <td>
                            <span class="deleteIcon" data-student-id="${student.phone_number}">🗑️</span> <!-- Значок удаления -->
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        output.innerHTML = ''; 
        output.appendChild(table);

        document.querySelectorAll('.deleteIcon').forEach(icon => {
            icon.addEventListener('click', async (event) => {
                const phoneNumber = event.target.getAttribute('data-student-id');
                await deleteStudent(phoneNumber);
                await updateStudentsTable(); 
            });
        });
    } catch (error) {
        console.error('Ошибка при загрузке таблицы студентов:', error);
    }
}
async function deleteStudent(phoneNumber) {
    try {
        const response = await fetch(`${API_URL}/students/${phoneNumber}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Студент успешно удалён:', phoneNumber);
            await updateStudentsTable();
        } else {
            const errorText = await response.text();
            console.error('Ошибка при удалении студента:', errorText);
        }
    } catch (error) {
        console.error('Ошибка подключения к серверу:', error);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addStudentForm').addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const studentName = document.getElementById('studentName').value.trim();
        const studentLastName = document.getElementById('studentLastName').value.trim();
        const admissionYear = document.getElementById('admissionYear').value.trim();
        const groupNameStudent = document.getElementById('groupNameStudent').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const studentResponseElement = document.getElementById('studentResponse');

        if (!studentName || !studentLastName || !admissionYear || !groupNameStudent || !phoneNumber) {
            studentResponseElement.innerText = 'Все поля обязательны.';
            studentResponseElement.style.color = 'red';
            return;
        }

        if (!phoneNumber.startsWith('+7')) {
            studentResponseElement.innerText = 'Номер телефона должен начинаться с "+7".';
            studentResponseElement.style.color = 'red';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: studentName,
                    last_name: studentLastName,
                    admission_year: admissionYear,
                    group_name: groupNameStudent,
                    phone_number: phoneNumber,
                }),
            });

            if (response.ok) {
                studentResponseElement.innerText = 'Студент успешно добавлен!';
                studentResponseElement.style.color = 'green';

                await updateStudentsTable();
            } else {
                const errorText = await response.text();
                studentResponseElement.innerText = `Ошибка: ${errorText}`;
                studentResponseElement.style.color = 'red';
            }
        } catch (error) {
            console.error('Ошибка подключения:', error);
            studentResponseElement.innerText = 'Ошибка подключения к серверу.';
            studentResponseElement.style.color = 'red';
        }
    });
});

async function updateSchedulesTable() {
    const output = document.getElementById('output'); 
    try {
        const response = await fetch(`${API_URL}/schedules`);
        if (!response.ok) {
            console.error('Ошибка при загрузке данных расписания:', await response.text());
            output.innerHTML = '<p>Ошибка при загрузке расписания.</p>';
            return;
        }
        const schedule = await response.json();
        if (schedule.length === 0) {
            output.innerHTML = '<p>Расписание отсутствует.</p>';
            return;
        }
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Группа</th>
                    <th>Предмет</th>
                    <th>День недели</th>
                    <th>Время</th>
                    <th>Аудитория</th>
                </tr>
            </thead>
            <tbody>
                ${schedule.map(item => `
                    <tr>
                        <td>${item.group_name}</td>
                        <td>${item.subject_name}</td>
                        <td>${item.day_of_week}</td>
                        <td>${item.time}</td>
                        <td>${item.classroom}</td>
                        <td>
                            <span class="deleteIcon"
                                data-group-name="${item.group_name}"
                                data-subject-name="${item.subject_name}"
                                data-day-of-week="${item.day_of_week}"
                                data-time="${item.time}"
                                data-classroom="${item.classroom}">🗑️</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        output.innerHTML = '';
        output.appendChild(table);

        document.querySelectorAll('.deleteIcon').forEach(icon => {
            icon.addEventListener('click', async (event) => {
                const groupName = event.target.getAttribute('data-group-name');
                const subjectName = event.target.getAttribute('data-subject-name');
                const dayOfWeek = event.target.getAttribute('data-day-of-week');
                const time = event.target.getAttribute('data-time');
                const classroom = event.target.getAttribute('data-classroom');

                console.log('Удаление записи с данными:', { groupName, subjectName, dayOfWeek, time, classroom });

                await deleteSchedule(groupName, subjectName, dayOfWeek, time, classroom);

                await updateSchedulesTable();
            });
        });
    } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        output.innerHTML = '<p>Ошибка загрузки расписания.</p>';
    }
}
async function deleteSchedule(groupName, subjectName, dayOfWeek, time, classroom) {
    try {
        const response = await fetch(`${API_URL}/schedules`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                group_name: groupName,
                subject_name: subjectName,
                day_of_week: dayOfWeek,
                time: time,
                classroom: classroom,
            }),
        });

        if (response.ok) {
            console.log('Запись успешно удалена:', { groupName, subjectName, dayOfWeek, time, classroom });

            await updateScheduleTable();
        } else {
            const errorText = await response.text();
            console.error('Ошибка при удалении:', errorText);
        }
    } catch (error) {
        console.error('Ошибка подключения к серверу:', error);
    }
}
document.getElementById('addScheduleForm').addEventListener('submit', async (event) => {
    event.preventDefault(); 
    const groupNameSchedule = document.getElementById('groupNameSchedule').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const dayOfWeek = document.getElementById('dayOfWeek').value.trim();
    const time = document.getElementById('time').value.trim();
    const classroom = document.getElementById('classroom').value.trim();
    const scheduleResponseElement = document.getElementById('scheduleResponse');

    if (!groupNameSchedule || !subject || !dayOfWeek || !time || !classroom) {
        scheduleResponseElement.innerText = 'Все поля обязательны.';
        scheduleResponseElement.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                group_name: groupNameSchedule,
                subject_name: subject,
                day_of_week: dayOfWeek,
                time: time,
                classroom: classroom,
            }),
        });

        if (response.ok) {
            const successMessage = await response.text(); 
            scheduleResponseElement.innerText = successMessage;
            scheduleResponseElement.style.color = 'green';
            await updateSchedulesTable();
        } else {
            const errorText = await response.text();
            scheduleResponseElement.innerText = `Ошибка: ${errorText}`;
            scheduleResponseElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Ошибка подключения:', error);
        scheduleResponseElement.innerText = 'Ошибка подключения к серверу.';
        scheduleResponseElement.style.color = 'red';
    }
});

document.getElementById('facultiesBtn').addEventListener('click', () => toggleData('faculties'));
document.getElementById('groupsBtn').addEventListener('click', async () => {
    const output = document.getElementById('output');

    if (output.innerHTML.trim() !== '') {
        output.innerHTML = ''; 
        return;
    }
    try {
        const response = await fetch(`${API_URL}/students_groups`);
        const groups = await response.json();

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Название группы</th>
                    <th>Факультет</th>
                </tr>
            </thead>
            <tbody id="groupsTableBody">
                ${groups.map(group => `
                    <tr>
                        <td>${group.group_name}</td>
                        <td>${group.faculty_name}</td>
                        <td>
                            <span class="deleteIcon" data-group="${group.group_name}">🗑️</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        output.appendChild(table);

        document.querySelectorAll('.deleteIcon').forEach(icon => {
            icon.addEventListener('click', async (event) => {
                const groupName = event.target.getAttribute('data-group');
                await deleteGroup(groupName);

                document.getElementById('groupsBtn').click();
            });
        });
    } catch (error) {
        console.error('Ошибка при получении данных групп:', error);
    }
});
document.getElementById('studentsBtn').addEventListener('click', async () => {
    const output = document.getElementById('output'); 

    if (output.innerHTML.trim() !== '') {
        output.innerHTML = ''; 
        return;
    }

    try {
        await updateStudentsTable(); 
    } catch (error) {
        console.error('Ошибка при загрузке таблицы студентов:', error);
    }
});
document.getElementById('schedulesBtn').addEventListener('click', async () => {
    const output = document.getElementById('output');

    if (output.innerHTML.trim() !== '') {
        output.innerHTML = ''; 
        return;
    }

    await updateSchedulesTable(); 
});
document.getElementById('allTablesBtn').addEventListener('click', () => toggleData('all-tables'));