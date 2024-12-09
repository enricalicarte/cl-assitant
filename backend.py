from flask import Flask, request, jsonify
import openai
import os

app = Flask(__name__)

# Configuración de la API Key de OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# ID del asistente con el que se interactúa
default_assistant_id = "asst_Do2g0wbk6u2bo8b2bnYMJjgw"

# Endpoint para gestionar Threads
@app.route('/threads', methods=['POST', 'GET', 'DELETE'])
def manage_threads():
    if request.method == 'POST':
        data = request.json
        thread = openai.Assistant.create_thread(
            assistant_id=default_assistant_id,
            name=data.get('name', 'Default Thread')
        )
        return jsonify(thread), 201

    elif request.method == 'GET':
        threads = openai.Assistant.list_threads(assistant_id=default_assistant_id)
        return jsonify(threads), 200

    elif request.method == 'DELETE':
        thread_id = request.args.get('id')
        if not thread_id:
            return jsonify({"error": "Thread ID is required"}), 400
        openai.Assistant.delete_thread(assistant_id=default_assistant_id, thread_id=thread_id)
        return jsonify({"message": "Thread deleted"}), 200

# Endpoint para gestionar Messages
@app.route('/messages', methods=['POST', 'GET', 'DELETE'])
def manage_messages():
    if request.method == 'POST':
        data = request.json
        message = openai.Assistant.create_message(
            assistant_id=default_assistant_id,
            thread_id=data['thread_id'],
            content=data['content']
        )
        return jsonify(message), 201

    elif request.method == 'GET':
        thread_id = request.args.get('thread_id')
        if not thread_id:
            return jsonify({"error": "Thread ID is required"}), 400
        messages = openai.Assistant.list_messages(assistant_id=default_assistant_id, thread_id=thread_id)
        return jsonify(messages), 200

    elif request.method == 'DELETE':
        message_id = request.args.get('id')
        if not message_id:
            return jsonify({"error": "Message ID is required"}), 400
        openai.Assistant.delete_message(assistant_id=default_assistant_id, message_id=message_id)
        return jsonify({"message": "Message deleted"}), 200

# Endpoint para gestionar Runs
@app.route('/runs', methods=['POST', 'GET', 'DELETE'])
def manage_runs():
    if request.method == 'POST':
        data = request.json
        run = openai.Assistant.create_run(
            assistant_id=default_assistant_id,
            thread_id=data['thread_id'],
            message_id=data.get('message_id'),
            parameters=data.get('parameters', {})
        )
        return jsonify(run), 201

    elif request.method == 'GET':
        thread_id = request.args.get('thread_id')
        if not thread_id:
            return jsonify({"error": "Thread ID is required"}), 400
        runs = openai.Assistant.list_runs(assistant_id=default_assistant_id, thread_id=thread_id)
        return jsonify(runs), 200

    elif request.method == 'DELETE':
        run_id = request.args.get('id')
        if not run_id:
            return jsonify({"error": "Run ID is required"}), 400
        openai.Assistant.delete_run(assistant_id=default_assistant_id, run_id=run_id)
        return jsonify({"message": "Run deleted"}), 200

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
