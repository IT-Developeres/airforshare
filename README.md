# AirForShare - Real-time Text & File Sharing Tool

Share text and files instantly across devices on same network or remotely via Firebase.

## Features ✨
- **Real-time text sharing** - Type and see updates instantly
- **File sharing** - Upload and download files
- **Network sharing** - Works on same WiFi/LAN without internet
- **Remote sharing** - Works globally via Firebase
- **Simple codes** - 6-character codes for easy sharing
- **Clear options** - Clear data and files easily
- **Multiple users** - Multiple people can use simultaneously

## Quick Start 🚀

### Method 1: Local Network (No Internet Required)
1. Double-click `start.bat` (Windows) or run `python server.py`
2. Share the network URL with others on same WiFi
3. Create shares and use codes to access

### Method 2: Remote Access (Internet Required)
1. Get Firebase config from [Firebase Console](https://console.firebase.google.com)
2. Replace the `firebaseConfig` object in `index.html`
3. Enable Firestore and Storage in Firebase
4. Use the tool from anywhere in the world

## Setup Instructions 📋

### For Local Network Use:
- No setup needed! Just run the server

### For Remote Use:
1. Create Firebase project
2. Enable Firestore Database
3. Enable Storage
4. Copy config and paste in `index.html`

## Usage 💡

### Creating a Share:
1. Enter title (optional)
2. Type or paste text
3. Select files (optional)
4. Click "Save & Share"
5. Share the generated code

### Opening a Share:
1. Enter the 6-character code
2. Click "Open"
3. View real-time text updates
4. Download files
5. Send quick text updates

### Clear Options:
- **Clear All**: Clears creation form
- **Clear Viewer**: Closes viewer and clears data

## Network Access 🌐

When you run the server, you'll get two URLs:
- `http://localhost:8000` - For your device
- `http://192.168.x.x:8000` - Share this with others on same network

## Security Notes 🔒
- Shares expire in 24 hours by default
- Files are stored securely in Firebase Storage
- Anonymous authentication is used
- No personal data is collected

## Requirements 📦
- Python 3.x (for local server)
- Modern web browser
- Firebase account (for remote access)

## Troubleshooting 🔧

**Port busy error?**
- The server will automatically try the next port

**Firebase not working?**
- Check your Firebase config
- Ensure Firestore and Storage are enabled
- Check browser console for errors

**Can't access on network?**
- Make sure devices are on same WiFi
- Check firewall settings
- Try different port: `python server.py 8080`

## File Structure 📁
```
airforshare/
├── index.html      # Main application
├── server.py       # Local server
├── start.bat       # Windows startup
└── README.md       # This file
```

## Tips 💭
- Use descriptive titles for better organization
- Share codes are case-sensitive
- Files are uploaded to cloud storage (if using Firebase)
- Multiple people can edit same share simultaneously
- Use "Clear All" to reset everything quickly

Enjoy sharing! 🎉