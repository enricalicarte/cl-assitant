from flask import Flask, request, jsonify
import requests
import os
import logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# Configuración de la API Key de OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
HEADERS = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2"
}
BASE_URL = "https://api.openai.com/v1"

# ID del asistente con el que se interactúa
default_assistant_id = "asst_Do2g0wbk6u2bo8b2bnYMJjgw"

# Endpoint para gestionar Threads eliminado por incompatibilidad
@app.route('/assistants/<assistant_id>/messages', methods=['GET'])
def list_messages(assistant_id):
    try:
        response = requests.get(f"{BASE_URL}/messages", headers=HEADERS, params={"assistant_id": assistant_id})
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para gestionar Messages
@app.route('/messages', methods=['POST', 'GET', 'DELETE'])
def manage_messages():
    try:
        if request.method == 'POST':
            data = request.json
            payload = {
                "assistant_id": default_assistant_id,
                "thread_id": data['thread_id'],
                "content": data['content']
            }
            response = requests.post(f"{BASE_URL}/messages", headers=HEADERS, json=payload)
            return jsonify(response.json()), response.status_code

        elif request.method == 'GET':
            thread_id = request.args.get('thread_id')
            if not thread_id:
                return jsonify({"error": "Thread ID is required"}), 400
            response = requests.get(f"{BASE_URL}/messages", headers=HEADERS, params={"assistant_id": default_assistant_id, "thread_id": thread_id})
            return jsonify(response.json()), response.status_code

        elif request.method == 'DELETE':
            message_id = request.args.get('id')
            if not message_id:
                return jsonify({"error": "Message ID is required"}), 400
            response = requests.delete(f"{BASE_URL}/messages/{message_id}", headers=HEADERS, params={"assistant_id": default_assistant_id})
            return jsonify(response.json()), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para gestionar Runs
@app.route('/runs', methods=['POST', 'GET', 'DELETE'])
def manage_runs():
    try:
        if request.method == 'POST':
            data = request.json
            payload = {
                "assistant_id": default_assistant_id,
                "thread_id": data['thread_id'],
                "message_id": data.get('message_id'),
                "parameters": data.get('parameters', {})
            }
            response = requests.post(f"{BASE_URL}/runs", headers=HEADERS, json=payload)
            return jsonify(response.json()), response.status_code

        elif request.method == 'GET':
            thread_id = request.args.get('thread_id')
            if not thread_id:
                return jsonify({"error": "Thread ID is required"}), 400
            response = requests.get(f"{BASE_URL}/runs", headers=HEADERS, params={"assistant_id": default_assistant_id, "thread_id": thread_id})
            return jsonify(response.json()), response.status_code

        elif request.method == 'DELETE':
            run_id = request.args.get('id')
            if not run_id:
                return jsonify({"error": "Run ID is required"}), 400
            response = requests.delete(f"{BASE_URL}/runs/{run_id}", headers=HEADERS, params={"assistant_id": default_assistant_id})
            return jsonify(response.json()), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para subir archivos
@app.route('/files', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        files = {"file": (file.filename, file.stream, file.mimetype)}
        data = {"purpose": "assistants"}
        response = requests.post(f"{BASE_URL}/files", headers={"Authorization": HEADERS["Authorization"]}, files=files, data=data)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para crear un vector store
@app.route('/vector_stores', methods=['POST'])
def create_vector_store():
    try:
        data = request.json
        payload = {"file_ids": data['file_ids']}
        response = requests.post(f"{BASE_URL}/vector_stores", headers=HEADERS, json=payload)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para vincular un vector store al asistente
@app.route('/assistants/<assistant_id>/tools', methods=['POST'])
def link_vector_store(assistant_id):
    try:
        data = request.json
        payload = {
            "tools": [{"type": "file_search"}],
            "tool_resources": {"file_search": {"vector_store_ids": data['vector_store_ids']}}
        }
        response = requests.patch(f"{BASE_URL}/assistants/{assistant_id}", headers=HEADERS, json=payload)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para verificar si la API está activa
@app.route('/')
def home():
    return jsonify({"message": "API is running"}), 200

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
