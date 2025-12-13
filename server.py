#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys
import json
from urllib.parse import urlparse, parse_qs

class AirForShareHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def do_GET(self):
        if self.path == '/api/sync':
            self.handle_sync_get()
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/sync':
            self.handle_sync_post()
        else:
            self.send_error(404)
    
    def handle_sync_get(self):
        try:
            with open('network_data.json', 'r') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data.encode())
        except FileNotFoundError:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{}')
    
    def handle_sync_post(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            with open('network_data.json', 'w') as f:
                f.write(post_data.decode())
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"success"}')
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def start_server(port=8000):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", port), AirForShareHandler) as httpd:
            local_ip = get_local_ip()
            
            print(f"\n🚀 AirForShare Server Started!")
            print(f"📱 Local access: http://localhost:{port}")
            print(f"🌐 Network access: http://{local_ip}:{port}")
            print(f"📂 Serving from: {os.getcwd()}")
            print(f"\n💡 Share the network URL with others on same WiFi")
            print(f"🔄 Network sync enabled - data auto-shares without codes")
            print(f"⚡ Press Ctrl+C to stop server\n")
            
            webbrowser.open(f"http://localhost:{port}")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped!")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {port} is busy. Trying port {port+1}...")
            start_server(port+1)
        else:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    start_server(port)