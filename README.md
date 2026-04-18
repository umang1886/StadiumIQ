# StadiumIQ 🏟️

Welcome to **StadiumIQ**, the ultimate real-time venue intelligence and fan engagement platform. StadiumIQ transforms the traditional live event experience into a seamless, highly interactive, and frictionless journey through smart crowd management, in-seat food delivery, interactive venue maps, and more.

## 🚀 Key Features

*   **🔒 Secure Authentication:** Modern, frictionless login and registration flow powered by Supabase Authentication with a stunning, highly responsive glassmorphism UI.
*   **🤖 SmartBot Integration:** An intelligent, context-aware intent matching bot that helps fans navigate the stadium, find facilities, and get instant answers without relying on external API delays.
*   **🍔 In-Seat Food Delivery:** A seamless mobile ordering system. Browse menus, order food, and have it delivered directly to your exact seat number using real-time status tracking.
*   **🗺️ Live Venue Navigation (NavEngine):** Interactive stadium maps with smart routing using optimized pathfinding algorithms (like Dijkstra's) to find the fastest way to exits, restrooms, or concessions.
*   **👥 CrowdSync:** Coordinate with your group! Create groups, share real-time locations, and never lose your friends in a crowded stadium again.
*   **⏳ Smart Queue Predictor:** Real-time estimations of wait times for restrooms and concession stands, powered by venue density data.
*   **🎮 Fan Score & Gamification:** Earn points by arriving early, using smart exit routes, and engaging with the app. Compete on leaderboards and unlock exclusive event badges!

## 💻 Tech Stack

### Frontend
*   **Framework:** React 18 with Vite
*   **Styling:** Tailwind CSS v4 for ultra-modern, fully responsive, and highly customizable UI components.
*   **State Management:** Zustand for lightweight, fast global state (Auth, Theme, Navigation).
*   **Routing:** React Router v6
*   **Icons:** Heroicons

### Backend & Database Integrations
*   **Backend Support:** Python (Flask) for heavy processing such as NavEngine and Queue prediction algorithms.
*   **Database & Realtime:** Supabase (PostgreSQL) for user management, real-time data syncs (food orders, crowd density), and secure row-level security (RLS).

## 🎨 UI/UX Design

The platform was built with a strict **"Mobile-First, Premium Aesthetics"** approach.
*   **Color Palette:** A vibrant, futuristic blend of Electric Cyan, Deep Blues, and Clean White.
*   **Design Language:** Glassmorphism (`backdrop-blur`), floating elements, subtle micro-animations (like pulse glows and hover lifts), and high-contrast typography using specialized fonts.

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A Supabase Account (for database and authentication)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/umang1886/StadiumIQ.git
   cd StadiumIQ
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `frontend` directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=http://localhost:5000 # If running backend locally
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License
This project is proprietary and built for providing next-generation venue intelligence.

---
*Built to redefine the fan experience.*
