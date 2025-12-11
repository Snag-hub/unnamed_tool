document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveButton');
  const statusParagraph = document.getElementById('status');

  saveButton.addEventListener('click', async () => {
    statusParagraph.textContent = 'Saving...';
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        // In a real scenario, you'd send this to your Next.js API
        // For local development, this URL needs to be accessible
        const response = await fetch('http://localhost:3000/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: tab.url }),
        });

        if (response.ok) {
          statusParagraph.textContent = 'Page saved successfully!';
        } else {
          const errorData = await response.json();
          statusParagraph.textContent = `Error: ${errorData.error || 'Failed to save page.'}`;
        }
      } else {
        statusParagraph.textContent = 'Could not get current page URL.';
      }
    } catch (error) {
      console.error('Error saving page:', error);
      statusParagraph.textContent = 'An unexpected error occurred.';
    }
  });
});
