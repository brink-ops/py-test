# backend/app.py
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os # Import the os module

app = Flask(__name__)
CORS(app)

# Define the path to the frontend directory (relative to backend/app.py)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

@app.route('/')
def home():
    return "Hello from the Flask Backend! Navigate to /api/message for a JSON response or /frontend/index.html to see the frontend."

@app.route('/api/message')
def get_message():
    """
    Returns a simple JSON message.
    """
    message = {"message": "Hello from the Python Flask Backend!"}
    return jsonify(message)

# Route to serve static files from the frontend directory
@app.route('/frontend/<path:filename>')
def serve_frontend(filename):
    """
    Serves static files (HTML, CSS, JS) from the frontend directory.
    """
    return send_from_directory(FRONTEND_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
