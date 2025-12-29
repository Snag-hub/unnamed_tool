// background.js
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Listen for messages from the popup script
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'savePage') {
    // In a more complex extension, you might handle saving logic here
    // For now, the saving logic is primarily in popup.js
    console.log('Background script received savePage action.');
  }
});
