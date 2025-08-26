// WebRTC setup
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Signaling server using WebSocket (example)
const ws = new WebSocket('wss://your-signaling-server.example'); 

ws.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    if (data.offer) {
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ answer }));
    } else if (data.answer) {
        await peerConnection.setRemoteDescription(data.answer);
    } else if (data.ice) {
        await peerConnection.addIceCandidate(data.ice);
    }
};

async function init() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ ice: event.candidate }));
        }
    };
}

init();

// Simple Chat
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

sendBtn.addEventListener('click', () => {
    const message = chatInput.value;
    if (message) {
        appendMessage(`You: ${message}`);
        ws.send(JSON.stringify({ chat: message }));
        chatInput.value = '';
    }
});

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.chat) appendMessage(`Peer: ${data.chat}`);
};

function appendMessage(msg) {
    const p = document.createElement('p');
    p.textContent = msg;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}
