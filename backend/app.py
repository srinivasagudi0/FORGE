from logging import root
import shlex
import subprocess
from pathlib import Path
import os
from flask import Flask, request, jsonify
import flask_cors
from app_db import delete_project, init_db, create_project, get_projects, get_project_by_id
import pty
import select
import signal
import threading
import fcntl
import termios
import struct
from flask_socketio import SocketIO, emit


app = Flask(__name__)
CORS = flask_cors.CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")
terminal_sessions = {}
init_db()

@app.route('/api/health')
def health_check():
    return {
        "status": "online",
        "application": "FORGE",
        "version": "0.1.0"
    }

def check_git_in_project(folder):
    try:
        result = subprocess.run(
            ["git", "-C", str(folder), "rev-parse", "--is-inside-work-tree"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0 and result.stdout.strip() == "true"
    except Exception as e:
        return False

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
    if not Path(folder_path).expanduser().resolve().is_dir():
        return {"error": "Provided folder path is not a directory."}, 400
    if not check_git_in_project(folder_path):
        return {"error": "Provided folder is not a Git repository."}, 400
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

    files.sort(key=lambda item: (not item["is_dir"], item["name"].lower()))

    return jsonify({"files": files})

@app.route('/api/projects/<int:project_id>/file')
def see_file(project_id):
    project_id = request.view_args['project_id']
    file_path = request.args.get('path', '')
    project = get_project_by_id(project_id)
    if not project:
        return {"error": "Project not found."}, 404
    if not file_path:
        return {"error": "File path not provided."}, 400
    root = Path(project[2]).expanduser().resolve()
    target = (root / file_path).resolve()
    if not target.is_relative_to(root):
        return {"error": "Access denied."}, 403
    if not target.is_file():
        return {"error": "Target path is not a file."}, 400
    if target.stat().st_size > 10 * 1024 * 1024:
        return {"error": "File too large."}, 413

    with open( target, 'r', encoding='utf-8') as f:
        try:
            content = target.read_text(encoding='utf-8')
        except Exception as e:
            return {"error": str(e)}, 500
        if content is None:
            content= "File is empty or could not be read."

    return jsonify({"content": content, "name": Path(file_path).name, "path": file_path})

@app.route('/api/projects/<int:project_id>/file/save', methods=['POST'])
def save_file(project_id):
    file_path = request.get_json().get('path', '')
    content = request.get_json().get('content', '')
    project = get_project_by_id(project_id)
    if not project:
        return {"error": "Project not found."}, 404
    if not file_path:
        return jsonify({"error": 'File path not provided.'}), 400
    if not isinstance(content, str):
        return jsonify({"error": 'Content must be a string.'}), 400
    root =Path(project[2]).expanduser().resolve()
    target = (root / file_path).resolve()
    if not target.is_relative_to(root):
        return jsonify({"error": 'Access denied.'}), 403
    if not target.is_file():
        return jsonify({"error": 'Target path is not a file.'}), 400
    if len(content.encode('utf-8')) > 1024 * 1024:
        return jsonify({"error": 'Content too large.'}), 413
    try:
        with open(target, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"message": "File saved successfully."})

@app.route('/api/projects/<int:project_id>/terminal', methods=['POST'])
def run_terminal(project_id):
    data = request.get_json(silent=True) or {}
    command = data.get('command', '')
    project = get_project_by_id(project_id)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    if not isinstance(command, str) or not command.strip():
        return jsonify({"error": "Command required."}), 400

    root = Path(project[2]).expanduser().resolve()
    with open("a.txt", "w") as f:
        f.write(f"PROJECT PATH: {root}\n")
        f.write(f"EXISTS: {root.exists()}\n")
        f.write(f"IS DIRECTORY: {root.is_dir()}\n")
    if not root.is_dir():
        return jsonify({"error": "Project folder path is not a directory."}), 400
    try:
        result = subprocess.run(
            shlex.split(command),
            cwd=root,
            capture_output=True,
            text=True,
            shell=False,
            timeout=15
        )
        return jsonify({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def read_terminal(session_id, fd):
    while True:
        try:
            output = os.read(fd, 4096).decode(errors='replace')
            socketio.emit(
                "terminal_output",
                {"output": output},
                to=session_id
            )
        except OSError:
            break


@socketio.on("terminal_start")
def start_terminal(data):
    project = get_project_by_id(data["project_id"])
    if not project:
        return
    folder = Path(project[2]).expanduser().resolve()
    if not folder.is_dir():
        return
    pid, fd = pty.fork()

    if pid == 0:
        os.chdir(folder)
        os.execl("/bin/zsh", "zsh", "-i")
    terminal_sessions[request.sid] = {
        "pid": pid,
        "fd": fd
    }
    threading.Thread(
        target=read_terminal,
        args=(request.sid, fd),
        daemon=True
    ).start()


@socketio.on("terminal_input")
def terminal_input(data):
    session = terminal_sessions.get(request.sid)

    if session:
        os.write(session["fd"], data["input"].encode())

@socketio.on("disconnect")
def terminal_disconnect():
    session = terminal_sessions.pop(request.sid, None)
    if session:
        try:
            os.killpg(session["pid"], signal.SIGHUP)
        except ProcessLookupError:
            pass
        try:
            os.close(session["fd"])
        except OSError:
            pass
@app.route("/api/projects/<int:project_id>/git")
def git_status(project_id):
    project = get_project_by_id(project_id)

    if not project:
        return jsonify({"error": "Project not found."}), 404

    folder = Path(project[2]).expanduser().resolve()

    if not folder.is_dir():
        return jsonify({"error": "Project folder path is not a directory."}), 400

    def git(*args):
        result = subprocess.run(
            ["git", "-C", str(folder), *args],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result
    try:
        check = git("rev-parse", "--show-toplevel")
        
        if check.returncode !=0:
            return jsonify({"error": "Not a git reppository."}), 400
        if not check.stdout.strip():
            return jsonify({"error": "Not a git repository."}), 400
        branch = git("branch", "--show-current")
        changes = git("status", "--short")

        return jsonify({
            "is_git_repo": True,
            "branch": branch.stdout.strip() or "detached HEAD",
            "changes": changes.stdout.strip().splitlines()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000, debug=False)