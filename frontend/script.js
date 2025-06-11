// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchButton');
    const backendMessageSpan = document.getElementById('backendMessage');

    const fetchMessage = async () => {
        try {
            // Use a relative path, or window.location.origin
            // Since Flask is serving the HTML from the same host and port 5000,
            // this will automatically go to http://<EC2_IP>:5000/api/message
            const response = await fetch('/api/message'); // <<< Change this line

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
    fetchMessage(); // Fetch message automatically when the page loads
});
