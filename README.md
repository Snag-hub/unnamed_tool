# DayOS - Your Personal Knowledge Hub

<div align="center">

**Save, organize, and revisit everything that matters.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[Features](#features) • [Quick Start](#quick-start) • [Extension](#browser-extension) • [Documentation](#documentation)

</div>

---

## ✨ Features

### 📚 Smart Content Management
- **Save Anything**: Articles, videos, PDFs, and webpages with one click
- **Rich Metadata**: Automatic title, description, and image extraction
- **Full-Text Search**: Find anything instantly with powerful search
- **Tags & Organization**: Categorize and filter your saved content

### 🎯 Productivity Tools
- **Reading List**: Curated inbox for articles you want to read
- **Notes**: Attach notes to any saved item
- **Tasks**: Built-in task management with due dates
- **Meetings**: Schedule and track meetings with notes
- **Timeline**: Visual calendar view of your saved content

### 🔔 Smart Reminders
- **Flexible Scheduling**: Set reminders for any item
- **Email Notifications**: Get daily summaries and reminders
- **Push Notifications**: Real-time alerts on your devices
- **Recurring Reminders**: Daily, weekly, or monthly schedules

### 🌐 Browser Extension
- **One-Click Save**: Save any webpage instantly
- **Context Menu**: Right-click to save links
- **Keyboard Shortcuts**: Quick access with hotkeys
- **Cross-Browser**: Chrome, Edge, and Firefox support

### 📱 Progressive Web App (PWA)
- **Install on Any Device**: Works like a native app
- **Offline Support**: Access your content without internet
- **Mobile Optimized**: Perfect touch experience
- **Fast & Responsive**: Smooth 60fps scrolling

### 🔐 Privacy & Security
- **Secure Authentication**: Powered by Clerk
- **API Token Access**: Secure extension integration
- **Data Export**: Download all your data anytime
- **Privacy First**: Your data stays yours

---

## 🚀 Quick Start

### For Users

1. **Visit the App**
   ```
   https://your-dayos-app.com
   ```

2. **Create an Account**
   - Sign up with email or social login
   - Verify your email address

3. **Install Browser Extension**
   - Download from [Chrome Web Store](#) or [Firefox Add-ons](#)
   - Or load manually: [Extension Setup Guide](./EXTENSION_GUIDE.md)

4. **Get Your API Token**
   - Go to Settings → Developer Access
   - Click "Generate Token"
   - Copy and paste into extension settings

5. **Start Saving!**
   - Click the extension icon on any page
   - Or use right-click → "Save to DayOS"

📖 **[Complete User Guide](./docs/USER_GUIDE.md)**

---

### For Developers

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Clerk account (for authentication)

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dayos.git
   cd dayos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."
   
   # Email (Resend)
   RESEND_API_KEY="re_..."
   
   # Push Notifications (optional)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

#### Build for Production
```bash
# Increase Node.js heap size for large projects
$env:NODE_OPTIONS='--max-old-space-size=4096'
npm run build
```

📖 **[Developer Documentation](./docs/DEVELOPMENT.md)**

---

## 🧩 Browser Extension

The DayOS browser extension lets you save any webpage with a single click.

### Quick Setup

1. **Download the Extension**
   - Chrome/Edge: Download `dayos-extension.zip` from Settings
   - Firefox: Download `dayos-extension-firefox.zip` from Settings

2. **Install**
   - **Chrome/Edge**: 
     - Go to `chrome://extensions/`
     - Enable "Developer mode"
     - Click "Load unpacked"
     - Select the extracted extension folder
   
   - **Firefox**:
     - Go to `about:debugging#/runtime/this-firefox`
     - Click "Load Temporary Add-on"
     - Select `manifest.json` from the extension folder

3. **Configure**
   - Click the extension icon
   - Enter your API token from DayOS Settings
   - Set your DayOS URL (e.g., `https://your-dayos-app.com`)

4. **Use**
   - Click the extension icon on any page to save
   - Or right-click → "Save to DayOS"
   - Or use keyboard shortcut: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)

📖 **[Complete Extension Guide](./EXTENSION_GUIDE.md)**

---

## 📚 Documentation

### User Guides
- **[Getting Started](./docs/GETTING_STARTED.md)** - First steps with DayOS
- **[Extension Setup](./EXTENSION_GUIDE.md)** - Install and configure the browser extension
- **[Features Overview](./docs/FEATURES.md)** - Detailed feature documentation
- **[FAQ](./docs/FAQ.md)** - Frequently asked questions

### Developer Guides
- **[Development Setup](./docs/DEVELOPMENT.md)** - Local development environment
- **[API Documentation](./docs/API.md)** - REST API reference
- **[Database Schema](./docs/DATABASE.md)** - Database structure
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment

### Extension Development
- **[Extension README](./extension/README.md)** - Extension overview
- **[Quick Start](./extension/QUICK_START.md)** - 5-minute setup
- **[Troubleshooting](./extension/TROUBLESHOOTING.md)** - Common issues

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Email**: [Resend](https://resend.com/)
- **PWA**: [next-pwa](https://github.com/shadowwalker/next-pwa)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Clerk](https://clerk.com/)
- Icons by [Lucide](https://lucide.dev/)
- Hosted on [Vercel](https://vercel.com/)

---

<div align="center">

**Made with ❤️ by the DayOS Team**

[Website](#) • [Documentation](./docs) • [Report Bug](https://github.com/yourusername/dayos/issues) • [Request Feature](https://github.com/yourusername/dayos/issues)

</div>
