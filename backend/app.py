from pathlib import Path
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
    project = get_project_by_id(project_id)
    if not project:
        return {"error": "Project not found."}, 404
    root = Path(project[2]).expanduser().resolve()

    if not root.is_dir():
        return {"error": "Project folder path is not a directory."}, 400

    current_path = request.args.get('path', '')

    try:
        target = (root / current_path).resolve()
        if not target.is_relative_to(root):
            return {"eroor": "Acess denied. "}

        if not target.is_dir():
            return {"error": "Target path is not a directory."}, 400

    except Exception as e:
        return {"error": str(e)}, 400

    files = []
    for item in target.iterdir():
        files.append({
            "name": item.name,
            "is_dir": item.is_dir(),
            "path": str(item.relative_to(root))
        })

    files.sort(key=lambda item: (not item["is_directory"], item["name"].lower()))

    return jsonify({"files": files})

if __name__ == '__main__':
    app.run()