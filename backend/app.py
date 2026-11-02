from flask import Flask, request, jsonify
import flask_cors
from app_db import delete_project, init_db, create_project, get_projects

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
    
if __name__ == '__main__':
    app.run()