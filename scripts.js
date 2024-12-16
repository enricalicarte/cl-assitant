// Selección de elementos del DOM
const chatHistory = document.getElementById("chat-history");
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

    // Añadir el mensaje del usuario al historial
    addMessage(message, "user");
    searchInput.value = "";

    // Añadir mensaje de carga temporal
    const loadingMessage = addMessage("Escribiendo...", "bot");

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

        // Reemplazar el mensaje de carga con la respuesta del bot
        loadingMessage.innerHTML = formatMessageToHTML(botMessage);

        // Añadir sistema de valoración
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

// Añadir mensaje al historial
function addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender}`;

    if (sender === "bot") {
        messageDiv.innerHTML = content; // Renderizar HTML correctamente
    } else {
        messageDiv.textContent = content; // Texto plano para mensajes del usuario
    }

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageDiv; // Devolver el elemento para futuras actualizaciones
}

// Añadir sistema de valoración con estrellas
function addStarRating(parentElement, answer) {
    const starContainer = document.createElement("div");
    starContainer.className = "star-rating";

    // Obtener la última pregunta del usuario
    const question = [...chatHistory.querySelectorAll(".chat-message.user")]
        .pop()?.textContent.trim() || "Pregunta desconocida";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        star.dataset.value = i;

        // Evento clic en la estrella
        star.addEventListener("click", (event) => {
            const rating = event.target.dataset.value;
            updateStarRating(starContainer, rating);
            console.log(`Valoración seleccionada: ${rating}`);

            // Enviar valoración al webhook
            sendRating(question, answer, rating);

            // Mostrar ventana de comentarios para valoraciones bajas (1, 2 o 3)
            if (rating <= 3) {
                showCommentBox(parentElement, question, answer, rating);
            }
        });

        starContainer.appendChild(star);
    }

    parentElement.appendChild(starContainer);
}

// Mostrar ventana para añadir comentarios
function showCommentBox(parentElement, question, answer, rating) {
    const commentBox = document.createElement("div");
    commentBox.className = "comment-box";

    // Crear elementos dentro de la ventana
    const commentLabel = document.createElement("label");
    commentLabel.textContent = "Por favor, dinos cómo podemos mejorar:";
    commentLabel.htmlFor = "comment-input";

    const commentInput = document.createElement("textarea");
    commentInput.id = "comment-input";
    commentInput.placeholder = "Escribe tus comentarios aquí...";
    commentInput.rows = 3;

    const sendCommentButton = document.createElement("button");
    sendCommentButton.textContent = "Enviar comentario";
    sendCommentButton.className = "send-comment-button";

    // Manejar el clic en el botón de enviar
    sendCommentButton.addEventListener("click", async () => {
        const comment = commentInput.value.trim();
        if (!comment) {
            alert("Por favor, escribe un comentario.");
            return;
        }

        // Enviar el comentario al webhook
        try {
            const response = await fetch("https://multiplicaenric.app.n8n.cloud/webhook-test/527dea54-5355-4717-bbb7-59ecd936269b", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "comment",
                    question,
                    answer,
                    rating,
                    comment,
                }),
            });

            if (!response.ok) {
                throw new Error(`Error al enviar el comentario: ${response.status} ${response.statusText}`);
            }

            console.log("Comentario enviado con éxito");
            alert("Gracias por tu comentario.");
            parentElement.removeChild(commentBox); // Eliminar la ventana de comentarios
        } catch (error) {
            console.error("Error al enviar el comentario:", error);
            alert("No se pudo enviar tu comentario. Inténtalo de nuevo más tarde.");
        }
    });

    // Añadir los elementos a la ventana
    commentBox.appendChild(commentLabel);
    commentBox.appendChild(commentInput);
    commentBox.appendChild(sendCommentButton);

    // Insertar la ventana después del mensaje del bot
    parentElement.appendChild(commentBox);
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

// Limpiar historial de chat
clearChatButton.addEventListener("click", () => {
    chatHistory.innerHTML = "";
});

// Manejar tecla Enter en el input
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Manejar clic en el botón Enviar
searchButton.addEventListener("click", sendMessage);

