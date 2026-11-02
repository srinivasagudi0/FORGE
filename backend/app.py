from flask import Flask
import flask_cors

app = Flask(__name__)
CORS = flask_cors.CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/api/health')
def health_check():
    return {
        "status": "online",
        "application": "FORGE",
        "version": "0.1.0"
    }

if __name__ == '__main__':
    app.run()