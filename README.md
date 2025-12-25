
# BEAM P2P - Secure Hub 🚀

**BEAM** is a high-performance, 100% serverless, and decentralized Peer-to-Peer (P2P) messaging platform. It allows users to establish direct, encrypted communication channels between devices simply by scanning a QR code—no accounts, no backend servers, and no AI overhead.

## 🛡️ Privacy First: No AI, No Backend
Unlike modern chat apps that rely on cloud processing or AI analysis, BEAM is built for pure privacy:
- **Zero AI Integration**: No external models or data processing.
- **Serverless Architecture**: Messages never touch a central database. Direct browser-to-browser WebRTC tunnels.
- **Incognito by Design**: No registration or tracking.

## ✨ Core Features
- **Direct Tunnels**: 1:1 ultra-secure private messaging.
- **Group Relays**: Multi-peer decentralized group chats.
- **QR Handshake**: Instant connection via mobile camera scanning.
- **Resource Sharing**: Share images and files up to 25MB directly.
- **End-to-End Encryption**: Leveraging WebRTC's native security protocols.

## 🛠️ Quick Start (Local Development)

To run BEAM on your local machine for testing or development:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/beam-p2p.git
   cd beam-p2p
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the app**:
   Open `http://localhost:5173` in your browser. To test P2P, open the same link on a different device or in an incognito window.

## 🚀 Deployment
Since BEAM is serverless, you can deploy it as a static site to **GitHub Pages**, **Vercel**, or **Netlify** with zero configuration.

## 💻 Tech Stack
- **React 19**: UI Logic.
- **PeerJS**: WebRTC P2P Tunnelling.
- **Tailwind CSS**: Styling.
- **Lucide React**: Icons.
- **HTML5-QRCode**: Camera scanning.

---
*Built for the open web. No tracking. No backend. Just Beam.*
