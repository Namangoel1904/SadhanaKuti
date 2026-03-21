# ⚡ CETPortal — End-to-End MHT-CET Exam Platform

A premium, dual-layer competitive exam portal featuring a secure Management Hub and a high-performance Exam Engine. Inspired by NTA (JEE/NEET) patterns and tailored for MHT-CET 2026.

## 🏗️ Project Architecture

The project is split into two main components:
- **Management Hub (Frontend):** Public-facing portal for student registration, dashboads, and admin management.
- **Exam Engine (Locked):** A secure, dark-themed interface for taking the actual exams with anti-cheat monitoring.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Nature Distilled 2026 aesthetic)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) (For NTA-style Admit Cards)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)
- **Routing:** [React Router 7](https://reactrouter.com/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Authentication:** JWT (JSON Web Tokens) + BcryptJS
- **File Handling:** [Multer](https://github.com/expressjs/multer) + [express-fileupload](https://github.com/richardgirges/express-fileupload)
- **Word Parsing:** [Mammoth.js](https://github.com/mwilliamson/mammoth.js) (Converts `.docx` question papers to JSON)

---

## 🌟 Key Features

### 👨‍🎓 Student Portal
- **Stream Selection:** Tailored flows for PCM (JEE) and PCB (NEET) students.
- **Exam Modes:** Students can register for exams in "Online" or "Offline" modes.
- **Bulk Booking & Discounts:** Registrations can be done in bulk. Booking 4 exams provides a discount (Offline: ₹999, Online: ₹699).
- **Manual Payment Workflow:** Scan QR code, upload screenshot for admin verification.
- **Dynamic Admit Cards:** Generates a 2-page A4 PDF with roll numbers and exam instructions for Offline exams.
- **Direct Online Access:** Confirmed online exams can be accessed via a direct "Start Exam" link on the day of the exam.
- **Result Analytics:** Track scores across different sections.

### 👩‍💼 Admin Management
- **Exam CRUD:** Create and manage upcoming exam schedules.
- **Verification Queue:** Review and approve/reject student registrations.
- **Paper Parser:** Instant question paper generation by uploading a standard Word doc.
- **Anti-Cheat Logs:** View student tab-switch screenshots captured during the exam.

### 📝 Exam Engine
- **MHT-CET UI:** Color-coded palette (Answered, Marked, Not Visited).
- **Auto-Section Lock:** Section 1 (Physics/Chem) auto-locks at 90 mins; Section 2 (Math/Bio) activates.
- **Cheat Detection:** Monitors tab switches and visibility changes in real-time.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Community Server

### Setup
1. **Clone & Install**
   ```bash
   # Install backend deps
   cd server && npm install
   # Install frontend deps
   cd ../client && npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/examportal
   JWT_SECRET=your_secret_here
   ADMIN_PASSKEY=EXAMENGINE2026
   ```

3. **Run Development Servers**
   ```bash
   # Terminal 1: Backend
   cd server && node index.js
   # Terminal 2: Frontend
   cd client && npm run dev
   ```

---

## 🔑 Default Credentials
- **Admin Email:** `admin@examportal.com`
- **Admin Password:** `Admin@2026`
- **Exam Engine Passkey:** `EXAMENGINE2026`
