document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const tokenSection = document.getElementById('tokenSection');
  const mainSection = document.getElementById('mainSection');
  const apiTokenInput = document.getElementById('apiToken');
  // const apiBaseInput = document.getElementById('apiBase'); // Removed per request
  const saveTokenButton = document.getElementById('saveToken');
  const changeTokenButton = document.getElementById('changeToken');
  const statusParagraph = document.getElementById('status');

  // Tabs & Content
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = {
    link: document.getElementById('tab-link'),
    reminder: document.getElementById('tab-reminder')
  };

  // Form Elements
  const pageTitleInput = document.getElementById('pageTitle');
  const saveLinkBtn = document.getElementById('saveButton');

  const remTitleInput = document.getElementById('remTitle');
  const remTimeSelect = document.getElementById('remTime');
  const saveReminderBtn = document.getElementById('saveReminder');


  // Default Base URL
  let API_BASE = 'https://dos4doers.snagdev.in/api';

  // --- Helpers ---

  // Browser agnostic APIs
  const api = typeof browser !== 'undefined' ? browser : chrome;

  async function getStorage(key) {
    if (window.browser && browser.storage) return browser.storage.local.get(key);
    return new Promise(resolve => chrome.storage.local.get(key, resolve));
  }

  async function setStorage(data) {
    if (window.browser && browser.storage) return browser.storage.local.set(data);
    return new Promise(resolve => chrome.storage.local.set(data, resolve));
  }

  async function getCurrentTab() {
    if (window.browser && browser.tabs) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      return tabs[0];
    }
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
    });
  }

  function setStatus(msg, type = 'normal') {
    statusParagraph.textContent = msg;
    statusParagraph.className = type;
    if (type === 'success') {
      setTimeout(() => {
        statusParagraph.textContent = '';
        statusParagraph.className = '';
      }, 3000);
    }
  }

  // --- Initialization ---

  // const { apiToken, apiBase } = await getStorage(['apiToken', 'apiBase']);
  const { apiToken } = await getStorage(['apiToken']);

  // Force Prod URL (Ignore stored base if any)
  // if (apiBase) {
  //   API_BASE = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;
  // }

  if (apiToken) {
    showMain();
    loadCurrentPageInfo();
  } else {
    showToken();
  }

  // --- UI Logic ---

  function showToken() {
    tokenSection.classList.remove('hidden');
    mainSection.classList.add('hidden');
  }

  function showMain() {
    tokenSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
  }

  async function loadCurrentPageInfo() {
    const tab = await getCurrentTab();
    if (tab && tab.title) {
      pageTitleInput.value = tab.title;
    }
  }

  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all
      tabBtns.forEach(b => b.classList.remove('active'));
      Object.values(tabContents).forEach(c => c.classList.add('hidden'));

      // Activate clicked
      btn.classList.add('active');
      const tabName = btn.dataset.tab;
      tabContents[tabName].classList.remove('hidden');
    });
  });

  // --- Actions ---

  // 1. Save Token
  saveTokenButton.addEventListener('click', async () => {
    const token = apiTokenInput.value.trim();
    // Use default or pre-configured base URL
    // For now using the default let API_BASE defined above or stored one if exists (though we are removing the UI to set it)
    // Actually, we should probably just save the token.

    if (token) {
      // We don't update apiBase from UI anymore. We use the default.
      await setStorage({ apiToken: token });

      showMain();
      loadCurrentPageInfo();
      setStatus('Connected!', 'success');
    } else {
      setStatus('Token is required', 'error');
    }
  });

  // 2. Change Token
  changeTokenButton.addEventListener('click', () => showToken());

  // 3. Save Link
  saveLinkBtn.addEventListener('click', async () => {
    setStatus('Saving link...');
    try {
      const { apiToken } = await getStorage('apiToken');
      const tab = await getCurrentTab();

      if (!tab || !tab.url) {
        setStatus('No URL found', 'error');
        return;
      }

      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}` },
        body: JSON.stringify({ url: tab.url })
      });

      if (res.ok) {
        setStatus('Link saved!', 'success');
      } else if (res.status === 429) {
        setStatus('Rate limit exceeded (3/min). Please wait.', 'error');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(data.error || 'Failed to save', 'error');
      }
    } catch (e) {
      setStatus('Network error', 'error');
    }
  });

  // 4. Save Reminder
  saveReminderBtn.addEventListener('click', async () => {
    const title = remTitleInput.value.trim();
    if (!title) {
      setStatus('Title is required', 'error');
      return;
    }

    setStatus('Scheduling...');

    // Calculate Time
    const timeKey = remTimeSelect.value;
    const now = new Date();
    let scheduledAt = new Date();

    switch (timeKey) {
      case '1h': scheduledAt.setHours(now.getHours() + 1); break;
      case '4h': scheduledAt.setHours(now.getHours() + 4); break;
      case 'tomorrow9':
        scheduledAt.setDate(now.getDate() + 1);
        scheduledAt.setHours(9, 0, 0, 0);
        break;
      case 'tomorrow18':
        scheduledAt.setDate(now.getDate() + 1);
        scheduledAt.setHours(18, 0, 0, 0);
        break;
      case 'nextweek':
        // Next Monday
        const day = now.getDay();
        const diff = now.getDate() - day + (day == 0 ? -6 : 1) + 7;
        // Simple logic: just add 7 days? Or real "Next Monday"?
        // Let's do simple: Today + 7 days
        scheduledAt.setDate(now.getDate() + 7);
        break;
    }

    try {
      const { apiToken } = await getStorage('apiToken');
      const res = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}` },
        body: JSON.stringify({
          title,
          scheduledAt: scheduledAt.toISOString()
        })
      });

      if (res.ok) {
        setStatus('Reminder set!', 'success');
        remTitleInput.value = ''; // Reset
      } else if (res.status === 429) {
        setStatus('Rate limit exceeded (3/min). Please wait.', 'error');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(data.error || 'Failed to set reminder', 'error');
      }
    } catch (e) {
      setStatus('Network error', 'error');
    }
  });

});
