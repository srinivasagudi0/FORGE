import sqlite3

def init_db():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL CHECK(length(name) > 0),
            folder_path TEXT NOT NULL UNIQUE CHECK(length(folder_path) > 0),
            language TEXT NOT NULL CHECK(length(language) > 0),
            date TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def create_project(name, folder_path, language, date, last_updated):
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO projects (name, folder_path, language, date, last_updated)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, folder_path, language, date, last_updated))
    conn.commit()
    conn.close()

def get_projects():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM projects')
    projects = cursor.fetchall()
    conn.close()
    return projects

def delete_project(project_id):
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
    conn.commit()
    conn.close()