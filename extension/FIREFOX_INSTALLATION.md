# Firefox Extension Installation Guide

## Two Ways to Use the Extension

### Option 1: Direct Installation (.xpi file) - For Testing
**Best for:** Testing the extension locally before publishing

1. **Download the .xpi file**
   - Get `dos4doers-extension-firefox.xpi` from the `public` folder

2. **Install in Firefox**
   - **Method A - Drag & Drop:**
     - Open Firefox
     - Drag `dos4doers-extension-firefox.xpi` into the Firefox window
     - Click "Add" when prompted
   
   - **Method B - about:addons:**
     - Open Firefox and go to `about:addons`
     - Click the gear icon (⚙️) → "Install Add-on From File..."
     - Select `dos4doers-extension-firefox.xpi`
     - Click "Add" when prompted

3. **Note:** This is a temporary installation. The extension will be removed when Firefox restarts unless you:
   - Go to `about:config`
   - Set `xpinstall.signatures.required` to `false` (not recommended for regular use)
   - Or use Firefox Developer Edition/Nightly

### Option 2: Firefox Add-ons Store (.zip file) - For Publishing
**Best for:** Publishing to the official Firefox Add-ons store

1. **Upload to Firefox Add-ons**
   - Go to [addons.mozilla.org/developers](https://addons.mozilla.org/developers)
   - Click "Submit a New Add-on"
   - Upload `dos4doers-extension-firefox.zip`
   - Complete the submission process

2. **Users Install From Store**
   - Once approved, users can install directly from the Firefox Add-ons store
   - This is a permanent installation

## For Development/Testing: Load Temporary Add-on

If you want to test during development without installing:

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to the extension folder and select `manifest.json` (from the extracted .xpi or .zip)
4. The extension will load temporarily (removed on Firefox restart)

## Current Files Available

| File | Purpose | Size |
|------|---------|------|
| `dos4doers-extension-firefox.xpi` | Direct installation | 18.71 KB |
| `dos4doers-extension-firefox.zip` | Store upload | 18.71 KB |

Both files are in the `public` folder.
