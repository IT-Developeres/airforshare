#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def start_server(port=8000):
    """Start HTTP server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            super().end_headers()
    
    try:
        with socketserver.TCPServer(("", port), MyHTTPRequestHandler) as httpd:
            local_ip = get_local_ip()
            
            print(f"\n🚀 AirForShare Server Started!")
            print(f"📱 Local access: http://localhost:{port}")
            print(f"🌐 Network access: http://{local_ip}:{port}")
            print(f"📂 Serving from: {os.getcwd()}")
            print(f"\n💡 Share the network URL with others on same WiFi/LAN")
            print(f"⚡ Press Ctrl+C to stop server\n")
            
            # Auto-open browser
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