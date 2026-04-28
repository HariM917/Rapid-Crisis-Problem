const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = [];
  }

  connect() {
    if (this.socket) return;

    this.socket = new WebSocket(WS_URL);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach(listener => listener(data));
    };

    this.socket.onclose = () => {
      this.socket = null;
      // Reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    };
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const socketService = new SocketService();
