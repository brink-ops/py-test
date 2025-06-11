// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const backendMessageSpan = document.getElementById('backendMessage');

    const fetchMessage = async () => {
        try {
            // --- CRITICAL CHANGE HERE ---
            // Use the Kubernetes internal service name for the backend
            // Service name: py-test-back-service
            // Service port: 5000
            // Backend endpoint: /api/message
            const response = await fetch('http://py-test-back-service:5000/api/message');
            // ---------------------------

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            backendMessageSpan.textContent = data.message;
        } catch (error) {
            console.error('Error fetching message:', error);
            backendMessageSpan.textContent = `Error: ${error.message}`;
        }
    };

    fetchButton.addEventListener('click', fetchMessage);

    // Fetch message automatically when the page loads
    fetchMessage();
});
