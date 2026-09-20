(function () {
  function createDefaultSettings() {
    return {
      profile: {
        email: '',
        fullName: '',
        linkedin: '',
        company: '',
        title: '',
        industry: '',
        startupBlurb: '',
        achievement: '',
        ask: '',
        rsvpComment: ''
      },
      dropdowns: getDefaultDropdownRules(),
      questions: getDefaultQuestionRules(),
      rsvp: {
        choice: 'going',
        attendeeLabel: '1 attendee',
        rsvpOpenDelay: 6000,
        autoSubmit: true,
        submitDelay: 1000,
        includeComment: false
      },
      automation: {
        eventList: [],
        maxConcurrent: 1,
        visitDuration: 120000,
        status: 'idle',
        progress: [],
        log: []
      }
    };
  }

  function getDefaultDropdownRules() {
    return [
      {
        id: 'job-title',
        title: 'Job title',
        matchers: ['what is your job title', 'job title'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'stage',
        title: 'Stage',
        matchers: ['what stage', 'stage?'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'fundraising',
        title: 'Raised / ticket size',
        matchers: ['how much have you raised', 'ticket size'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'arr',
        title: 'ARR',
        matchers: ['arr', 'annual recurring revenue'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'volunteer',
        title: 'Volunteer interest',
        matchers: ['volunteer', 'help with this event'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'sponsor',
        title: 'Sponsorship interest',
        matchers: ['sponsor this event', 'sponsoring this event'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'host-linkedin',
        title: 'Add host on LinkedIn',
        matchers: ['please add me linkedin', 'add me linkedin', 'approval rate'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'ticket-purchase',
        title: 'Ticket purchase acknowledgement',
        matchers: ['people who purchase tickets'],
        preferred: '',
        fallbacks: []
      },
      {
        id: 'follow-linkedin',
        title: 'Follow on LinkedIn',
        matchers: ['are you following us on linkedin'],
        preferred: '',
        fallbacks: []
      }
    ];
  }

  function getDefaultQuestionRules() {
    return [
      {
        id: 'nachonacho',
        matchType: 'contains',
        pattern: 'nachonacho.com',
        answerType: 'text',
        value: ''
      },
      {
        id: 'whatsapp-group',
        matchType: 'contains',
        pattern: 'whatsapp group',
        answerType: 'text',
        value: ''
      },
      {
        id: 'raised-capital',
        matchType: 'contains',
        pattern: 'have you raised capital',
        answerType: 'text',
        value: ''
      }
    ];
  }

  let settings = null;

  document.addEventListener('DOMContentLoaded', async () => {
    settings = await loadSettings();
    hydrateProfile();
    hydrateDropdowns();
    hydrateQuestions();
    hydrateRsvp();
    hydrateAutomation();
    wireEvents();
  });

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        const merged = deepMerge(createDefaultSettings(), result.settings || {});
        if (!result.settings) {
          chrome.storage.local.set({ settings: merged });
        }
        resolve(merged);
      });
    });
  }

  function saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings }, () => resolve());
    });
  }

  function hydrateProfile() {
    const form = document.getElementById('profile-form');
    Object.entries(settings.profile).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (field) {
        field.value = value || '';
      }
    });
  }

  function hydrateDropdowns() {
    const container = document.getElementById('dropdown-list');
    container.innerHTML = '';
    settings.dropdowns.forEach((rule, index) => {
      const instance = createDropdownRuleElement(rule, index);
      container.appendChild(instance);
    });
  }

  function hydrateQuestions() {
    const container = document.getElementById('question-list');
    container.innerHTML = '';
    settings.questions.forEach((rule, index) => {
      const instance = createQuestionRuleElement(rule, index);
      container.appendChild(instance);
    });
  }

  function hydrateRsvp() {
    const form = document.getElementById('rsvp-form');
    form.elements.namedItem('choice').value = settings.rsvp.choice;
    form.elements.namedItem('attendeeLabel').value = settings.rsvp.attendeeLabel || '';
    form.elements.namedItem('rsvpOpenDelay').value = settings.rsvp.rsvpOpenDelay || 6000;
    form.elements.namedItem('autoSubmit').checked = settings.rsvp.autoSubmit !== false;
    form.elements.namedItem('submitDelay').value = settings.rsvp.submitDelay || 1000;
    form.elements.namedItem('includeComment').checked = Boolean(settings.rsvp.includeComment);
  }

  function hydrateAutomation() {
    const form = document.getElementById('automation-form');
    form.elements.namedItem('eventList').value = (settings.automation.eventList || []).join('\n');
    form.elements.namedItem('maxConcurrent').value = settings.automation.maxConcurrent || 1;
    form.elements.namedItem('visitDuration').value = settings.automation.visitDuration || 5000;
    form.elements.namedItem('keepTabsOpen').checked = Boolean(settings.automation.keepTabsOpen);
    form.elements.namedItem('makeTabsVisible').checked = Boolean(settings.automation.makeTabsVisible);
    renderAutomationLog();
  }

  function renderAutomationLog() {
    const logContainer = document.getElementById('automation-log');
    logContainer.innerHTML = '';
    (settings.automation.log || []).slice(-100).forEach((entry) => {
      const div = document.createElement('div');
      div.textContent = `${new Date(entry.timestamp).toLocaleTimeString()} • ${entry.message}`;
      logContainer.appendChild(div);
    });
  }

  function wireEvents() {
    document.getElementById('profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      Object.keys(settings.profile).forEach((key) => {
        const field = form.elements.namedItem(key);
        settings.profile[key] = field ? field.value.trim() : '';
      });
      await saveSettings();
      flashStatus('profile-status', 'Saved');
    });

    document.getElementById('add-dropdown').addEventListener('click', async () => {
      settings.dropdowns.push({
        id: crypto.randomUUID(),
        title: '',
        matchers: [],
        preferred: '',
        fallbacks: []
      });
      await saveSettings();
      hydrateDropdowns();
    });

    document.getElementById('add-question').addEventListener('click', async () => {
      settings.questions.push({
        id: crypto.randomUUID(),
        matchType: 'exact',
        pattern: '',
        answerType: 'text',
        value: ''
      });
      await saveSettings();
      hydrateQuestions();
    });

    document.getElementById('rsvp-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      settings.rsvp.choice = form.elements.namedItem('choice').value;
      settings.rsvp.attendeeLabel = form.elements.namedItem('attendeeLabel').value.trim();
      settings.rsvp.rsvpOpenDelay = Math.max(0, parseInt(form.elements.namedItem('rsvpOpenDelay').value, 10) || 0);
      settings.rsvp.autoSubmit = form.elements.namedItem('autoSubmit').checked;
      settings.rsvp.submitDelay = parseInt(form.elements.namedItem('submitDelay').value, 10) || 0;
      settings.rsvp.includeComment = form.elements.namedItem('includeComment').checked;
      await saveSettings();
      flashStatus('rsvp-status', 'Saved');
    });

    document.getElementById('automation-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      const rawList = form.elements.namedItem('eventList').value;
      const urlList = rawList
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      settings.automation.eventList = urlList;
      settings.automation.maxConcurrent = Math.max(1, parseInt(form.elements.namedItem('maxConcurrent').value, 10) || 1);
      settings.automation.visitDuration = Math.max(120000, parseInt(form.elements.namedItem('visitDuration').value, 10) || 120000);
      settings.automation.keepTabsOpen = form.elements.namedItem('keepTabsOpen').checked;
      settings.automation.makeTabsVisible = form.elements.namedItem('makeTabsVisible').checked;
      await saveSettings();
      flashStatus('automation-status', 'Saved');
      sendRuntimeMessage({ type: 'automation:updateSettings' });
    });

    document.getElementById('start-automation').addEventListener('click', () => {
      sendRuntimeMessage({ type: 'automation:start' });
    });

    document.getElementById('pause-automation').addEventListener('click', () => {
      sendRuntimeMessage({ type: 'automation:pause' });
    });

    document.getElementById('clear-automation').addEventListener('click', async () => {
      settings.automation.log = [];
      settings.automation.progress = [];
      settings.automation.status = 'idle';
      await saveSettings();
      renderAutomationLog();
      sendRuntimeMessage({ type: 'automation:clear' });
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'automation:logUpdate') {
        settings.automation.log = message.log;
        renderAutomationLog();
      }
    });
  }

  function createDropdownRuleElement(rule, index) {
    const template = document.getElementById('dropdown-template');
    const node = template.content.cloneNode(true);
    const fieldset = node.querySelector('fieldset');
    fieldset.dataset.index = String(index);

    const titleInput = fieldset.querySelector('input[name="title"]');
    titleInput.value = rule.title || '';
    titleInput.addEventListener('input', handleDropdownChange);

    const matcherInput = fieldset.querySelector('input[name="matchers"]');
    matcherInput.value = (rule.matchers || []).join(', ');
    matcherInput.addEventListener('input', handleDropdownChange);

    const preferredInput = fieldset.querySelector('input[name="preferred"]');
    preferredInput.value = rule.preferred || '';
    preferredInput.addEventListener('input', handleDropdownChange);

    const fallbackInput = fieldset.querySelector('input[name="fallbacks"]');
    fallbackInput.value = (rule.fallbacks || []).join(', ');
    fallbackInput.addEventListener('input', handleDropdownChange);

    fieldset.querySelector('.remove-rule').addEventListener('click', async () => {
      settings.dropdowns.splice(index, 1);
      await saveSettings();
      hydrateDropdowns();
    });

    return node;
  }

  function handleDropdownChange(event) {
    const fieldset = event.target.closest('fieldset');
    const index = parseInt(fieldset.dataset.index, 10);
    const rule = settings.dropdowns[index];
    rule.title = fieldset.querySelector('input[name="title"]').value.trim();
    rule.matchers = fieldset.querySelector('input[name="matchers"]').value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    rule.preferred = fieldset.querySelector('input[name="preferred"]').value.trim();
    rule.fallbacks = fieldset.querySelector('input[name="fallbacks"]').value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    saveSettings();
  }

  function createQuestionRuleElement(rule, index) {
    const template = document.getElementById('question-template');
    const node = template.content.cloneNode(true);
    const fieldset = node.querySelector('fieldset');
    fieldset.dataset.index = String(index);

    const matchTypeSelect = fieldset.querySelector('select[name="matchType"]');
    matchTypeSelect.value = rule.matchType || 'exact';
    matchTypeSelect.addEventListener('change', handleQuestionChange);

    const patternInput = fieldset.querySelector('input[name="pattern"]');
    patternInput.value = rule.pattern || '';
    patternInput.addEventListener('input', handleQuestionChange);

    const answerTypeSelect = fieldset.querySelector('select[name="answerType"]');
    answerTypeSelect.value = rule.answerType || 'text';
    answerTypeSelect.addEventListener('change', handleQuestionChange);

    const valueInput = fieldset.querySelector('input[name="value"]');
    valueInput.value = rule.value || '';
    valueInput.addEventListener('input', handleQuestionChange);

    fieldset.querySelector('.remove-rule').addEventListener('click', async () => {
      settings.questions.splice(index, 1);
      await saveSettings();
      hydrateQuestions();
    });

    return node;
  }

  function handleQuestionChange(event) {
    const fieldset = event.target.closest('fieldset');
    const index = parseInt(fieldset.dataset.index, 10);
    const rule = settings.questions[index];
    rule.matchType = fieldset.querySelector('select[name="matchType"]').value;
    rule.pattern = fieldset.querySelector('input[name="pattern"]').value.trim();
    rule.answerType = fieldset.querySelector('select[name="answerType"]').value;
    rule.value = fieldset.querySelector('input[name="value"]').value.trim();
    saveSettings();
  }

  function flashStatus(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    setTimeout(() => {
      el.textContent = '';
    }, 2000);
  }

  function sendRuntimeMessage(payload) {
    chrome.runtime.sendMessage(payload, () => {
      if (chrome.runtime.lastError) {
        console.warn('Runtime message failed', chrome.runtime.lastError);
      }
    });
  }

  function deepMerge(target, source) {
    const output = Array.isArray(target) ? [...target] : { ...target };
    if (Array.isArray(target)) {
      return source && Array.isArray(source) ? [...source] : output;
    }
    if (typeof source !== 'object' || source === null) {
      return output;
    }
    Object.keys(source).forEach((key) => {
      if (Array.isArray(source[key])) {
        if (key === 'dropdowns' || key === 'questions') {
          output[key] = mergeArrayById(target[key] || [], source[key]);
        } else {
          output[key] = [...source[key]];
        }
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    return output;
  }

  function mergeArrayById(defaults, stored) {
    const defaultsById = new Map(defaults.map((item) => [item.id, item]));
    const storedById = new Map(stored.map((item) => [item.id, item]));
    const result = [];

    stored.forEach((storedItem) => {
      const defaultItem = defaultsById.get(storedItem.id);
      if (defaultItem) {
        const isCustomized = JSON.stringify(storedItem) !== JSON.stringify(defaultItem);
        if (isCustomized) {
          result.push(storedItem);
        } else {
          result.push(defaultItem);
        }
      } else {
        result.push(storedItem);
      }
    });

    defaults.forEach((defaultItem) => {
      if (!storedById.has(defaultItem.id)) {
        result.push(defaultItem);
      }
    });

    return result;
  }
})();
