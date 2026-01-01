# DayOS Browser Extension Guide

Save any webpage to DayOS with a single click! This guide covers installation, configuration, and usage for Chrome, Edge, and Firefox.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [How to Use](#how-to-use)
5. [Features](#features)
6. [Troubleshooting](#troubleshooting)
7. [Advanced](#advanced)

---

## ⚡ Quick Start

**5-Minute Setup:**

1. Get your API token from [DayOS Settings](https://your-dayos-app.com/settings)
2. Download the extension for your browser
3. Install the extension
4. Configure with your API token
5. Start saving pages!

---

## 📥 Installation

### Chrome / Edge (Recommended)

#### Option 1: From Web Store (Coming Soon)
- Visit the [Chrome Web Store](#) or [Edge Add-ons](#)
- Click "Add to Chrome" or "Get"
- The extension installs automatically

#### Option 2: Manual Installation (Current Method)

1. **Download the Extension**
   - Go to [DayOS Settings](https://your-dayos-app.com/settings)
   - Scroll to **Browser Extension**
   - Click **"Download for Chrome/Edge"**
   - Save the `.zip` file

2. **Extract the Files**
   - Right-click the downloaded `.zip` file
   - Select "Extract All..."
   - Choose a permanent location (e.g., `Documents/DayOS-Extension`)
   - **Important**: Don't delete this folder after installation!

3. **Open Extensions Page**
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
   - Or click the puzzle icon → "Manage extensions"

4. **Enable Developer Mode**
   - Toggle the **"Developer mode"** switch in the top right corner

5. **Load the Extension**
   - Click **"Load unpacked"** button
   - Navigate to the folder where you extracted the files
   - Select the folder and click "Select Folder"

6. **Pin the Extension** (Optional but Recommended)
   - Click the puzzle icon in your browser toolbar
   - Find "DayOS" in the list
   - Click the pin icon to keep it visible

✅ **Done!** The DayOS icon should now appear in your toolbar.

---

### Firefox

#### Option 1: From Add-ons Store (Coming Soon)
- Visit [Firefox Add-ons](#)
- Click "Add to Firefox"
- The extension installs automatically

#### Option 2: Manual Installation (Current Method)

1. **Download the Extension**
   - Go to [DayOS Settings](https://your-dayos-app.com/settings)
   - Scroll to **Browser Extension**
   - Click **"Download for Firefox"**
   - Save the `.xpi` file

2. **Install**
   - Open Firefox
   - Go to `about:addons`
   - Click the gear icon (⚙️)
   - Select **"Install Add-on From File..."**
   - Choose the downloaded `.xpi` file
   - Click **"Add"** when prompted

3. **Pin the Extension** (Optional)
   - Click the puzzle icon in your toolbar
   - Find "DayOS"
   - Click the pin icon

✅ **Done!** The DayOS icon should now appear in your toolbar.

---

## ⚙️ Configuration

### Get Your API Token

1. Open [DayOS Settings](https://your-dayos-app.com/settings)
2. Scroll to **Developer Access**
3. Click **"Generate Token"** (if you don't have one)
4. Click **"Show"** to reveal your token
5. Click **"Copy"** to copy it to clipboard

### Configure the Extension

1. **Click the DayOS icon** in your browser toolbar
2. You'll see the extension popup
3. **Paste your API token** in the "API Token" field
4. **Enter your DayOS URL**:
   - Production: `https://your-dayos-app.com`
   - Local development: `http://localhost:3000`
5. Click **"Save"**

✅ **You're all set!** The extension is now connected to your DayOS account.

---

## 🎯 How to Use

### Method 1: Extension Icon (Recommended)

1. Navigate to any webpage you want to save
2. Click the **DayOS icon** in your toolbar
3. The page is saved instantly!
4. You'll see a confirmation notification

### Method 2: Right-Click Menu

1. Right-click anywhere on the page
2. Select **"Save to DayOS"** from the context menu
3. The page is saved!

### Method 3: Keyboard Shortcut

- **Windows/Linux**: `Ctrl + Shift + S`
- **Mac**: `Cmd + Shift + S`

> **Tip**: You can customize the keyboard shortcut in your browser's extension settings.

### Method 4: Save Links

1. Right-click on any link
2. Select **"Save Link to DayOS"**
3. The linked page is saved without opening it!

---

## ✨ Features

### Automatic Metadata Extraction

When you save a page, DayOS automatically captures:
- **Title**: Page title
- **Description**: Meta description
- **Image**: Featured image or Open Graph image
- **URL**: Full URL
- **Favicon**: Site icon
- **Content**: Full article text (when available)

### Smart Detection

The extension intelligently detects:
- **Articles**: Extracts clean, readable content
- **Videos**: Captures video metadata
- **PDFs**: Saves PDF links
- **Images**: Saves image URLs

### Instant Sync

- Saved items appear in your DayOS inbox immediately
- Access from any device
- Works across all your browsers

### Privacy First

- Your API token is stored securely in your browser
- No data is sent to third parties
- All communication is encrypted (HTTPS)

---

## 🔧 Troubleshooting

### Extension Not Saving Pages

**Problem**: Clicking the icon does nothing

**Solutions**:
1. Check your API token is correct
2. Verify your DayOS URL is correct
3. Make sure you're connected to the internet
4. Try refreshing the page and clicking again
5. Check the browser console for errors (F12 → Console)

### "Invalid API Token" Error

**Problem**: Extension shows "Invalid API Token"

**Solutions**:
1. Go to DayOS Settings → Developer Access
2. Click "Regenerate Token"
3. Copy the new token
4. Paste it into the extension settings
5. Click "Save"

### Extension Icon Not Visible

**Problem**: Can't find the DayOS icon

**Solutions**:
1. Click the puzzle icon in your toolbar
2. Find "DayOS" in the list
3. Click the pin icon to make it visible
4. If not in the list, reinstall the extension

### "Failed to Save" Error

**Problem**: Extension shows "Failed to save page"

**Solutions**:
1. Check your internet connection
2. Verify the DayOS URL is accessible
3. Try saving a different page
4. Check if the page blocks scraping (some sites do)
5. Contact support if the issue persists

### Extension Disappeared After Browser Update

**Problem**: Extension vanished after updating browser

**Solutions**:
1. Go to `chrome://extensions/` or `edge://extensions/`
2. Check if the extension is disabled
3. Re-enable it
4. If not there, reinstall using the manual method

---

## 🚀 Advanced

### Custom Keyboard Shortcuts

**Chrome/Edge**:
1. Go to `chrome://extensions/shortcuts`
2. Find "DayOS"
3. Click the pencil icon
4. Press your desired key combination
5. Click "OK"

**Firefox**:
1. Go to `about:addons`
2. Click the gear icon
3. Select "Manage Extension Shortcuts"
4. Find "DayOS"
5. Set your custom shortcut

### Developer Mode

If you're developing or testing:

1. Keep the extension folder in a permanent location
2. Any changes to the code require clicking "Reload" in `chrome://extensions/`
3. Check the console for debugging (right-click extension icon → "Inspect popup")

### Using with Local Development

1. Run DayOS locally: `npm run dev`
2. Configure extension with `http://localhost:3000`
3. Generate a local API token from `http://localhost:3000/settings`
4. Save pages to your local instance

---

## 📚 Additional Resources

- **[Extension Quick Start](./extension/QUICK_START.md)** - 5-minute setup guide
- **[Troubleshooting Guide](./extension/TROUBLESHOOTING.md)** - Detailed problem solving
- **[Main Documentation](./README.md)** - Full DayOS documentation
- **[Getting Started](./docs/GETTING_STARTED.md)** - New user guide

---

## 🆘 Need Help?

- **Documentation**: Check our [full documentation](./README.md)
- **FAQ**: See [Frequently Asked Questions](./docs/FAQ.md)
- **Support**: Email us at support@dayos.com
- **Bug Reports**: [Open an issue](https://github.com/yourusername/dayos/issues)

---

**Happy saving! 🎉**
