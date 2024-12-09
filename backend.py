from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Clave API de OpenAI
API_KEY = "OPENAI_API_KEY"   # Reemplaza con tu clave API real
API_URL = "https://api.openai.com/v1/assistants"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

@app.route("/", methods=["GET"])
def home():
    return "¡Bienvenido al backend para Cumlaude!", 200

@app.route("/ask", methods=["POST"])
def ask_cumlaude():
    try:
        # Obtener el mensaje del usuario
        data = request.get_json()
        user_message = data.get("prompt", "").strip()

        if not user_message:
            return jsonify({"error": "El campo 'prompt' no puede estar vacío."}), 400

        # Crear un hilo para Cumlaude
        assistant_id = "asst_YvXWL3CSeZFLrIa9PrqLNBD2"  # ID de tu asistente Cumlaude
        thread_response = requests.post(
            f"{API_URL}/{assistant_id}/threads",
            headers=headers,
            json={"messages": [{"role": "user", "content": user_message}]}
        )

        if thread_response.status_code != 200:
            return jsonify({"error": "Error al crear el hilo con OpenAI"}), 500

        thread_data = thread_response.json()
        thread_id = thread_data["id"]

        # Ejecutar el asistente en el hilo creado
        run_response = requests.post(
            f"{API_URL}/{assistant_id}/threads/{thread_id}/runs",
            headers=headers
        )

        if run_response.status_code != 200:
            return jsonify({"error": "Error al ejecutar el asistente"}), 500

        run_data = run_response.json()
        latest_message = run_data["latest_message"]["content"]

        return jsonify({"response": latest_message})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
