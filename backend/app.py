import os
from flask import Flask, request, jsonify
import flask_cors
from app_db import delete_project, init_db, create_project, get_projects, get_project_by_id

app = Flask(__name__)
CORS = flask_cors.CORS(app, resources={r"/api/*": {"origins": "*"}})
init_db()

@app.route('/api/health')
def health_check():
    return {
        "status": "online",
        "application": "FORGE",
        "version": "0.1.0"
    }

@app.route('/api/projects/create', methods=['POST'])
def make_project():
    data = request.get_json()
    name = data.get('name')
    folder_path = data.get('folder_path')
    language = data.get('language')
    date = data.get('date')
    last_updated = data.get('last_updated')
    if not all([name, folder_path, language, date, last_updated]):
        return {"error": "Missing required fields."}, 400
    try:
        create_project(name, folder_path, language, date, last_updated)
    except Exception as e:
        return {"error": str(e)}, 400
    return {"message": "Project created successfully."}

@app.route('/api/projects/view')
def view_projects():
    try:
        projects = get_projects()
        return {"projects": projects}
    except Exception as e:
        return {"error": str(e)}, 400

@app.route('/api/projects/delete', methods=['POST'])
def remove_project():
    data = request.get_json()
    project_id = data.get('id')
    if not project_id:
        return {"error": "Missing project ID."}, 400
    try:
        delete_project(project_id)
        return {"message": "Project deleted successfully."}
    except Exception as e:
        return {"error": str(e)}, 400

@app.route('/api/projects/<int:project_id>/files')
def list_project_files(project_id):
    try:
        project = get_project_by_id(project_id)
    if not project:
        return {"error": "Project not found."}, 404
    folder_path = project[2]  # Assuming folder_path is the third column in the
    if not os.path.isdir(folder_path):
        return {"error": "Project folder path does not exist."}, 400
    cont = os.listdir(folder_path)
    return jsonify({"files": cont})

if __name__ == '__main__':
    app.run()