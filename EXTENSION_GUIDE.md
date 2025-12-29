# DayOS Extension Guide

This guide provides instructions on how to install the DayOS browser extension and how to upload it to the Microsoft Edge Add-ons store. (The Chrome version is currently available via manual installation).

## 📥 Installation

### Firefox
1. Download the [Firefox Extension (XPI)](/24db911f6eb143cc8f61-1.0.xpi).
2. Open Firefox and go to `about:addons`.
3. Click the gear icon and select "Install Add-on From File...".
4. Select the downloaded `.xpi` file.

### Chrome / Edge (Manual/Local Install)
> [!TIP]
> This is the recommended way to use DayOS on Chrome-based browsers while we wait for store approval.

1. **Download**: Click the [Chromium Extension (Zip)](/dayos-extension-chromium.zip) link on the landing page.
2. **Extract**: Unzip the file to a permanent folder on your computer (e.g., `Documents/DayOS-Extension`).
3. **Open Extensions Page**: 
   - Chrome: Go to `chrome://extensions`
   - Edge: Go to `edge://extensions`
4. **Enable Developer Mode**: Toggle the **Developer mode** switch (usually in the top right or left sidebar).
5. **Load Extension**:
   - Click the **Load unpacked** button.
   - Select the folder where you extracted the zip files.
6. **Done!**: The DayOS icon should now appear in your toolbar. (Tip: Click the puzzle icon to **Pin** it for easy access).

---

## 🚀 How to Upload to App Stores

### 🌐 Microsoft Edge Add-ons
> [!NOTE]
> Chrome Web Store upload instructions have been omitted as there is a one-time $5 developer fee required, which is currently being deferred.

1. **Prepare**: Use the `dayos-extension.zip` file.
2. **Account**: Sign in to the [Microsoft Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/public/login).
3. **Upload**:
   - Click "**Create new extension**".
   - Upload the `.zip` file.
4. **Metadata**: Fill in the store listing details (can be the same as Chrome).
5. **Submit**: Click "**Submit**" for review.

---

## 🛠️ Configuration
Once installed, click the DayOS icon in your browser and:
1. Go to your [DayOS Settings](http://dayos.snagdev.in/settings) (or your local instance).
2. Copy your **API Token**.
3. Paste it into the extension popup and click **Save**.

---

### 🛠️ Developer Note (Manifest Versions)
For contributors loading the `/extension` folder directly:
- **Chrome / Edge**: Uses the default `manifest.json` (Manifest V3).
- **Firefox**: Rename `manifest.v2.json` to `manifest.json` temporarily if loading manually, or use the provided `.xpi`.
