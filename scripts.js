const chatHistory = document.getElementById("chat-history");
const brandSelector = document.getElementById("brand-selector");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearChatButton = document.getElementById("clear-chat-button");

// Enviar mensaje al Webhook
async function sendMessage() {
    const message = searchInput.value.trim();
    const selectedBrand = brandSelector.value;

    if (!message || message.length > 500) {
        alert("Por favor, escribe un mensaje válido.");
        return;
    }

    addMessage(message, "user");
    searchInput.value = "";

    // Mostrar mensaje de carga temporal
    const loadingMessage = addMessage("Escribiendo...", "bot");

    try {
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

        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            botMessage = formatMessageToHTML(data.output || "Sin respuesta del servidor.");
        } else {
            botMessage = await response.text();
        }

        // Reemplazar mensaje de carga con la respuesta del bot
        loadingMessage.innerHTML = botMessage;
        addStarRating(loadingMessage, botMessage);
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        loadingMessage.innerHTML = "Error al conectar con el servidor.";
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

// Añadir mensaje al historial con formato HTML y sistema de valoración
function addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender}`;

    if (sender === "bot") {
        messageDiv.innerHTML = content; // Renderiza HTML correctamente
        addStarRating(messageDiv, content); // Agrega el sistema de valoración después del mensaje del bot
    } else {
        messageDiv.textContent = content; // Texto plano para mensajes del usuario
    }

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageDiv; // Devuelve el elemento para futuras actualizaciones
}

// Agregar sistema de valoración con estrellas
function addStarRating(parentElement, answer) {
    const starContainer = document.createElement("div");
    starContainer.className = "star-rating";

    // Obtener la última pregunta del usuario en el historial
    const question = [...chatHistory.querySelectorAll(".chat-message.user")]
        .pop()?.textContent.trim() || "Pregunta desconocida";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        star.dataset.value = i;

        // Manejar el clic en la estrella
        star.addEventListener("click", (event) => {
            const rating = event.target.dataset.value;
            updateStarRating(starContainer, rating);
            console.log(`Valoración seleccionada: ${rating}`);

            // Enviar valoración al Webhook
            sendRating(question, answer, rating);
        });

        starContainer.appendChild(star);
    }

    parentElement.appendChild(starContainer);
}

// Actualizar visualización de estrellas seleccionadas
function updateStarRating(container, rating) {
    const stars = container.querySelectorAll(".star");
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add("selected");
        } else {
            star.classList.remove("selected");
        }
    });
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

// Limpiar chat
clearChatButton.addEventListener("click", () => {
    chatHistory.innerHTML = "";
});

// Manejar evento de tecla Enter
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Manejar clic en botón Enviar
searchButton.addEventListener("click", sendMessage);