    // ----------------- PASTE YOUR FIREBASE CONFIG HERE -----------------
    // Replace the following object with your Firebase config from console
    const firebaseConfig = {
      apiKey: "AIzaSyDH0E6mkfkEUh76nv__2fOk-HJteZCj-hE",
    authDomain: "airforshare-ffcee.firebaseapp.com",
    projectId: "airforshare-ffcee",
    storageBucket: "airforshare-ffcee.firebasestorage.app",
    messagingSenderId: "1086862252600",
    appId: "1:1086862252600:web:d0aad96edea3ab6f27e4cd"
    };
    // ------------------------------------------------------------------

    // Minimal validation
    if (!firebaseConfig || !firebaseConfig.projectId) {
      console.warn("Firebase config missing — paste your firebaseConfig object in the code.");
    }

    // Firebase imports (modular)
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
    import { getFirestore, collection, doc, setDoc, getDoc, addDoc, serverTimestamp, onSnapshot, updateDoc, arrayUnion, writeBatch, runTransaction, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
    import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
    import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

    // init
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const auth = getAuth(app);

    // Sign in anonymously for simple usage (optional)
    signInAnonymously(auth).catch((e)=>console.warn("Anon sign-in failed:", e));
    onAuthStateChanged(auth, user => {
      if (user) console.log("Signed in as", user.uid);
    });

    // DOM refs
    const createBtn = document.getElementById("createBtn");
    const shareTitle = document.getElementById("shareTitle");
    const shareText = document.getElementById("shareText");
    const shareFiles = document.getElementById("shareFiles");
    const createdBox = document.getElementById("createdBox");
    const generatedCodeEl = document.getElementById("generatedCode");
    const copyCodeBtn = document.getElementById("copyCodeBtn");
    const openViewerBtn = document.getElementById("openViewerBtn");
    const clearBtn = document.getElementById("clearBtn");
    const clearViewerBtn = document.getElementById("clearViewerBtn");

    const openCodeInput = document.getElementById("openCodeInput");
    const openBtn = document.getElementById("openBtn");
    const viewer = document.getElementById("viewer");
    const viewerCode = document.getElementById("viewerCode");
    const viewerTitle = document.getElementById("viewerTitle");
    const liveText = document.getElementById("liveText");
    const filesList = document.getElementById("filesList");
    const quickText = document.getElementById("quickText");
    const sendQuickText = document.getElementById("sendQuickText");
    const viewerMeta = document.getElementById("viewerMeta");

    // Utility: generate short base62 code (6 chars)
    const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    function genCode(len=6){
      let s="";
      for(let i=0;i<len;i++) s+=CHARS[Math.floor(Math.random()*CHARS.length)];
      return s;
    }

    // Create a share document with generated code
    createBtn.addEventListener("click", async () => {
      const title = shareTitle.value.trim() || "Untitled";
      const text = shareText.value || "";
      const files = shareFiles.files;
      const code = genCode(6);

      // default expiry 24 hours from now (optional)
      const expiresAt = new Date(Date.now() + 24*60*60*1000);

      // prepare share doc
      const shareDocRef = doc(db, "shares", code);

      // create doc in transaction to avoid collisions (rare)
      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(shareDocRef);
          if (snap.exists()) throw "collision";
          tx.set(shareDocRef, {
            code,
            title,
            ownerUid: auth.currentUser ? auth.currentUser.uid : null,
            createdAt: serverTimestamp(),
            expiresAt: expiresAt,
            latestText: text,
            viewers: [],
            filesCount: 0
          });
        });
      } catch (e) {
        console.warn("Collision creating code, retrying...", e);
        // on collision, simply retry (very unlikely)
        return createBtn.click();
      }

      // upload files if any
      if (files && files.length > 0) {
        const uploadPromises = [];
        for (const f of files) {
          uploadPromises.push(uploadFileForShare(code, f));
        }
        await Promise.all(uploadPromises);
        // update filesCount
        const shareRef = doc(db, "shares", code);
        await updateDoc(shareRef, { filesCount: files.length });
      }

      // show created UI
      generatedCodeEl.textContent = code;
      createdBox.style.display = "block";
      createdBox.scrollIntoView({behavior:"smooth"});
    });

    async function uploadFileForShare(code, file){
      const fileDocRef = doc(collection(db, "shares", code, "files")); // auto id
      const path = `shares/${code}/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, path);
      // upload bytes with resumable so larger files ok
      const uploadTask = uploadBytesResumable(sRef, file);
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', (snapshot)=>{
          // could show progress if desired
        }, (err)=>{
          console.error("Upload failed", err);
          reject(err);
        }, async ()=>{
          // success
          const url = await getDownloadURL(sRef);
          await setDoc(fileDocRef, {
            filename: file.name,
            storagePath: path,
            downloadURL: url,
            size: file.size,
            contentType: file.type || null,
            uploadedAt: serverTimestamp(),
            uploader: auth.currentUser ? auth.currentUser.uid : null
          });
          resolve();
        });
      });
    }

    // Clear all data function
    function clearAllData() {
      shareTitle.value = "";
      shareText.value = "";
      shareFiles.value = "";
      createdBox.style.display = "none";
      generatedCodeEl.textContent = "";
    }

    function clearViewer() {
      viewer.style.display = "none";
      openCodeInput.value = "";
      quickText.value = "";
      liveText.textContent = "";
      filesList.innerHTML = "";
      viewerMeta.textContent = "";
      if (currentUnsubscribe) currentUnsubscribe();
      if (currentFilesUnsub) currentFilesUnsub();
    }

    // Clear buttons
    clearBtn.addEventListener("click", clearAllData);
    clearViewerBtn.addEventListener("click", clearViewer);

    // Copy code button
    copyCodeBtn.addEventListener("click", () => {
      const code = generatedCodeEl.textContent;
      if (!code) return;
      navigator.clipboard.writeText(code).then(()=> alert("Code copied to clipboard"));
    });

    // Open viewer for the created code
    openViewerBtn.addEventListener("click", () => {
      const code = generatedCodeEl.textContent;
      if (!code) return alert("No code created");
      openCodeInput.value = code;
      openBtn.click();
    });

    // Open share by code
    let currentUnsubscribe = null;
    let currentFilesUnsub = null;
    openBtn.addEventListener("click", async () => {
      const code = openCodeInput.value.trim();
      if (!code) return alert("Enter a code");
      // detach previous listeners
      if (currentUnsubscribe) currentUnsubscribe();
      if (currentFilesUnsub) currentFilesUnsub();

      const shareRef = doc(db, "shares", code);
      // get once and then subscribe for realtime
      const snap = await getDoc(shareRef);
      if (!snap.exists()) return alert("Share not found or expired");
      viewer.style.display = "block";
      viewerCode.textContent = code;
      viewerTitle.textContent = snap.data().title || "Share";

      // realtime listener for share doc (updates to latestText, metadata)
      currentUnsubscribe = onSnapshot(shareRef, docSnap => {
        if (!docSnap.exists()){
          alert("Share removed or expired");
          viewer.style.display = "none";
          return;
        }
        const d = docSnap.data();
        liveText.textContent = d.latestText || "";
        const createdAt = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString() : "unknown";
        const expires = d.expiresAt ? new Date(d.expiresAt.seconds*1000).toLocaleString() : "none";
        viewerMeta.textContent = `Created: ${createdAt} • Expires: ${expires} • Files: ${d.filesCount || 0}`;
      });

      // realtime listener for files subcollection
      const filesCol = collection(db, "shares", code, "files");
      // simple polling: listen to recent files
      currentFilesUnsub = onSnapshot(filesCol, (qSnap) => {
        filesList.innerHTML = "";
        qSnap.forEach(docFile => {
          const f = docFile.data();
          const el = document.createElement("div");
          el.className = "file-row";
          el.innerHTML = `<div><strong>${escapeHtml(f.filename)}</strong> <div class="muted small">${(f.size/1024).toFixed(1)} KB • uploaded</div></div>
            <div>
              <button data-url="${f.downloadURL}" class="downloadBtn">Download</button>
            </div>`;
          filesList.appendChild(el);
        });
        // attach download listeners
        document.querySelectorAll(".downloadBtn").forEach(b=>{
          b.onclick = () => {
            const url = b.dataset.url;
            window.open(url, "_blank");
          };
        });
      });
    });

    // Enter key support for inputs
    quickText.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendQuickText.click();
    });
    
    openCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") openBtn.click();
    });

    // Quick text send: append an "edit" entry and update latestText
    sendQuickText.addEventListener("click", async () => {
      const code = viewerCode.textContent;
      if (!code) return alert("Open a share first");
      const val = quickText.value.trim();
      if (!val) return;
      const editsCol = collection(db, "shares", code, "edits");
      const shareRef = doc(db, "shares", code);

      // create an edit doc and also update latestText in transaction
      try {
        await runTransaction(db, async (tx) => {
          const sSnap = await tx.get(shareRef);
          if (!sSnap.exists()) throw "Share missing";
          // create edit
          const newEditRef = doc(editsCol); // auto id
          tx.set(newEditRef, {
            text: val,
            createdAt: serverTimestamp(),
            author: auth.currentUser ? auth.currentUser.uid : null
          });
          // update latestText by appending
          const prev = sSnap.data().latestText || "";
          const combined = prev ? prev + "\n" + val : val;
          tx.update(shareRef, { latestText: combined });
        });
        quickText.value = "";
      } catch (e) {
        console.error("Failed to send quick text", e);
        alert("Failed to send update");
      }
    });

    // Helper: escape HTML for safe insertion
    function escapeHtml(str){
      if(!str) return "";
      return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
    }

    // Simple cleanup note: expired shares are not auto-deleted by this client.
    // You can add a Cloud Function to periodically delete expired share docs and storage files.

    // OPTIONAL: If you want P2P (WebRTC) direct transfer when both peers are on same network,
    // we can add a signaling channel using Firestore (e.g., collection 'webrtc_signals/{code}').
    // That reduces storage usage and speeds up LAN transfers. Tell me if you want that and I'll add.
