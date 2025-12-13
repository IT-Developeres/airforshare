const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving files
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store shares in memory
const shares = {};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Invalid message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Handle different message types
function handleMessage(ws, data) {
    switch (data.type) {
        case 'create_share':
            shares[data.code] = data.share;
            ws.send(JSON.stringify({
                type: 'share_created',
                code: data.code
            }));
            console.log(`Share created: ${data.code}`);
            break;
            
        case 'get_share':
            if (shares[data.code]) {
                ws.send(JSON.stringify({
                    type: 'share_data',
                    code: data.code,
                    share: shares[data.code]
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'share_not_found',
                    code: data.code
                }));
            }
            break;
            
        case 'update_share':
            if (shares[data.code]) {
                const timestamp = new Date().toLocaleTimeString();
                const update = `\n[${timestamp}] ${data.message}`;
                shares[data.code].text = (shares[data.code].text || '') + update;
                shares[data.code].lastUpdate = new Date().toISOString();
                
                // Broadcast update to all clients
                broadcastUpdate(data.code, shares[data.code]);
                console.log(`Share updated: ${data.code}`);
            }
            break;
            
        case 'get_file':
            if (shares[data.code] && shares[data.code].files[data.fileIndex]) {
                const file = shares[data.code].files[data.fileIndex];
                ws.send(JSON.stringify({
                    type: 'file_data',
                    filename: file.name,
                    data: file.data
                }));
            }
            break;
    }
}

// Broadcast updates to all connected clients
function broadcastUpdate(code, shareData) {
    const message = JSON.stringify({
        type: 'share_updated',
        code: code,
        share: shareData
    });
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Start server
const PORT = 8080;
server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log('\n🚀 AirForShare Server Started!');
    console.log(`📱 Local access: http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://${localIP}:${PORT}`);
    console.log(`🔌 WebSocket server running on port ${PORT}`);
    console.log('\n💡 Share the network URL with others on same WiFi');
    console.log('⚡ Press Ctrl+C to stop server\n');
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server stopped!');
    process.exit(0);
});