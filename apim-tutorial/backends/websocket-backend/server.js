const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8025 });

function getRandomLocation() {
  // Generate random latitude and longitude
  const latitude = (Math.random() * 180 - 90).toFixed(6);
  const longitude = (Math.random() * 360 - 180).toFixed(6);
  return { latitude, longitude };
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send a random location every 1 second
  const sendLocationInterval = setInterval(() => {
    const location = getRandomLocation();
    ws.send(JSON.stringify(location));
  }, 1000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(sendLocationInterval);
  });
});

console.log('WebSocket server running on ws://localhost:8025');

