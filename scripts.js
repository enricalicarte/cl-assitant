// Selección de elementos del DOM
const brandSelector = document.getElementById("brand-selector");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearChatButton = document.getElementById("clear-chat-button");

// Enviar mensaje al Webhook
async function sendMessage() {
    const message = searchInput.value.trim();
    const selectedBrand = brandSelector.value;

    if (!message) {
        alert("Por favor, escribe un mensaje válido.");
        return;
    }

    if (!selectedBrand) {
        alert("Por favor, selecciona una marca.");
        return;
    }

    // Mostrar mensaje de carga temporal
    const loadingMessage = "Escribiendo...";

    try {
        // Enviar la solicitud al webhook
        const response = await fetch("https://multiplicaenric.app.n8n.cloud/webhook-test/527dea54-5355-4717-bbb7-59ecd936269b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "message",
                message,
                brand: selectedBrand,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("Content-Type");
        let botMessage;

        // Manejar respuestas JSON y HTML
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();

            // Manejar el caso de un array con una propiedad `html`
            if (Array.isArray(data) && data[0]?.html) {
                botMessage = data[0].html;
            } else if (data.output) {
                botMessage = data.output;
            } else {
                botMessage = "Formato de respuesta desconocido.";
            }
        } else {
            // Si la respuesta no es JSON, tratarla como texto plano (HTML)
            botMessage = await response.text();
        }

        console.log("Respuesta del bot:", botMessage);
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

// Enviar valoración al Webhook
async function sendRating(question, answer, rating) {
    try {
        const response = await fetch("https://multiplicaenric.app.n8n.cloud/webhook-test/527dea54-5355-4717-bbb7-59ecd936269b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "rating",
                question,
                answer,
                rating,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al guardar la valoración: ${response.status} ${response.statusText}`);
        }

        console.log("Valoración enviada con éxito");
    } catch (error) {
        console.error("Error al enviar la valoración:", error);
    }
}

// Formatear texto con marcas a HTML
function formatMessageToHTML(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **texto** -> <strong>texto</strong>
        .replace(/\*(.*?)\*/g, "<em>$1</em>") // *texto* -> <em>texto</em>
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>') // [texto](url) -> <a href="url">texto</a>
        .replace(/\n\n/g, "</p><p>") // Doble salto de línea -> cierre y apertura de párrafo
        .replace(/\n/g, "<br>") // Salto de línea -> <br>
        .replace(/^/, "<p>") // Agregar <p> al inicio
        .replace(/$/, "</p>"); // Agregar </p> al final
}

// Manejar tecla Enter en el input
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Manejar clic en el botón Enviar
searchButton.addEventListener("click", sendMessage);
