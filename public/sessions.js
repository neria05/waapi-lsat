function login() {
    const apiKey = document.getElementById('apiKeyInput').value;
    if (apiKey) {
        sessionStorage.setItem('apiKey', apiKey);
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('sessionsContainer').style.display = 'block';
        loadSessions();
    } else {
        document.getElementById('loginError').innerText = "API Key is required.";
    }
}

function loadSessions() {
    const apiKey = sessionStorage.getItem('apiKey');
    fetch('/sessions', {
        headers: {
            'x-api-key': apiKey
        }
    })
    .then(response => response.json())
    .then(sessions => {
        const tbody = document.getElementById('sessionsBody');
        tbody.innerHTML = '';
        sessions.forEach(session => {
            const row = `
                <tr>
                    <td>${session.sessionId}</td>
                    <td>${session.status}</td>
                    <td>${session.apiKey || 'Not Available'}</td>
                    <td>
                        <button class="button" onclick="deleteSession('${session.sessionId}')">Delete</button>
                        <button class="button" onclick="reconnectSession('${session.sessionId}')">Reconnect</button>
                        <button class="button" onclick="updateWebhook('${session.sessionId}')">Update Webhook</button>
                        <button class="button" onclick="getQR('${session.sessionId}')">Get QR</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    })
    .catch(error => {
        console.error('Error loading sessions:', error);
        alert('Failed to load sessions. Please refresh the page.');
    });
}

function createNewSession() {
    const sessionId = prompt("Enter new session ID:");
    if (sessionId) {
        fetch(`/genapi/${sessionId}`, { 
            method: 'POST',
            headers: { 'x-api-key': sessionStorage.getItem('apiKey') }
        })
        .then(response => response.json())
        .then(data => {
            alert(`New session created with API key: ${data.apiKey}`);
            loadSessions();
            getQR(sessionId);
        })
        .catch(error => {
            console.error('Error creating new session:', error);
            alert('Failed to create new session. Please try again.');
        });
    }
}

function deleteSession(sessionId) {
    if (confirm(`Are you sure you want to delete session ${sessionId}?`)) {
        fetch(`/delapi/${sessionId}`, { 
            method: 'DELETE',
            headers: { 'x-api-key': sessionStorage.getItem('apiKey') }
        })
        .then(response => {
            if (response.ok) {
                alert(`Session ${sessionId} deleted`);
                loadSessions();
            } else {
                response.text().then(text => {
                    alert(`Failed to delete session: ${text}`);
                });
            }
        })
        .catch(error => {
            console.error('Error deleting session:', error);
            document.getElementById('errorMessage').innerText = 'Failed to delete session. Please try again.';
        });
    }
}

function reconnectSession(sessionId) {
    fetch(`/start/${sessionId}`, { 
        headers: { 'x-api-key': sessionStorage.getItem('apiKey') }
    })
    .then(response => response.text())
    .then(result => {
        alert(result);
        loadSessions();
    })
    .catch(error => {
        console.error('Error reconnecting session:', error);
        alert('Failed to reconnect session. Please try again.');
    });
}

function updateWebhook(sessionId) {
    const newWebhook = prompt("Enter new webhook URL:");
    if (newWebhook) {
        fetch(`/set-webhook/${sessionId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': sessionStorage.getItem('apiKey')
            },
            body: JSON.stringify({ webhookUrl: newWebhook })
        })
        .then(response => response.text())
        .then(result => {
            alert(result);
            loadSessions();
        })
        .catch(error => {
            console.error('Error updating webhook:', error);
            alert('Failed to update webhook. Please try again.');
        });
    }
}

function getQR(sessionId) {
    fetch(`/qr/${sessionId}`, { 
        headers: { 'x-api-key': sessionStorage.getItem('apiKey') }
    })
    .then(response => {
        if (response.status === 202) {
            alert('QR code not yet generated. Please wait a moment and try again.');
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.qrCode) {
            const qrWindow = window.open("", "QR Code", "width=300,height=300");
            qrWindow.document.write(`<img src="${data.qrCode}" alt="QR Code">`);
        }
    })
    .catch(error => {
        console.error('Error fetching QR code:', error);
        alert('Failed to fetch QR code. Please try again.');
    });
}

// Initialize login state
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('apiKey')) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('sessionsContainer').style.display = 'block';
        loadSessions();
    }
});