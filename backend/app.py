from flask import Flask, request
import flask_cors
from app_db import init_db

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
def create_project():
    data = request.get_json()
    name = data.get('name')
    folder_path = data.get('folder_path')
    language = data.get('language')
    date = data.get('date')
    last_updated = data.get('last_updated')


if __name__ == '__main__':
    app.run()