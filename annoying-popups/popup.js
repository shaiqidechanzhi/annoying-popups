// 加载配置
async function loadConfig() {
  const result = await chrome.runtime.sendMessage({ action: 'getConfig' });
  return { config: result.config, ads: result.ads };
}

// 保存配置
async function saveConfig(config) {
  await chrome.runtime.sendMessage({ action: 'saveConfig', config });
}

// 初始化
(async function init() {
  const { config } = await loadConfig();
  
  document.getElementById('enableToggle').checked = config.enabled;
  document.getElementById('frequencySelect').value = config.frequency;
  document.getElementById('intervalSeconds').value = config.intervalSeconds || 30;
  
  if (config.frequency === 'interval') {
    document.getElementById('intervalSettings').style.display = 'block';
  }
  
  if (config.killSwitchActivated) {
    showKillSwitchStatus(config);
  }
  
  bindEvents();
  startKillTimerIfNeeded(config);
})();

function bindEvents() {
  // 开关
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    const { config } = await loadConfig();
    config.enabled = e.target.checked;
    await saveConfig(config);
    notifyContentScript('configUpdated');
  });
  
  // 频率
  document.getElementById('frequencySelect').addEventListener('change', async (e) => {
    const { config } = await loadConfig();
    config.frequency = e.target.value;
    await saveConfig(config);
    notifyContentScript('configUpdated');
    
    document.getElementById('intervalSettings').style.display = 
      e.target.value === 'interval' ? 'block' : 'none';
  });
  
  // 间隔秒数
  document.getElementById('intervalSeconds').addEventListener('change', async (e) => {
    const { config } = await loadConfig();
    config.intervalSeconds = parseInt(e.target.value) || 30;
    await saveConfig(config);
    notifyContentScript('configUpdated');
  });
  
  // 立即弹一个
  document.getElementById('triggerBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'triggerPopup' });
  });
  
  // 弹5个
  document.getElementById('triggerManyBtn').addEventListener('click', () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'triggerPopup' });
      }, i * 300);
    }
  });
  
  // 永久关闭
  document.getElementById('killSwitchBtn').addEventListener('click', async () => {
    if (confirm('确定要永久关闭弹窗吗？需要等待10分钟才能重新开启。')) {
      await chrome.runtime.sendMessage({ action: 'killSwitch' });
      const { config } = await loadConfig();
      showKillSwitchStatus(config);
      notifyContentScript('configUpdated');
    }
  });
  
  // 取消永久关闭
  document.getElementById('cancelKillBtn').addEventListener('click', async () => {
    if (confirm('确定要取消永久关闭吗？弹窗将恢复。')) {
      await chrome.runtime.sendMessage({ action: 'cancelKillSwitch' });
      document.getElementById('killSwitchStatus').style.display = 'none';
      notifyContentScript('configUpdated');
    }
  });
  
  // 设置页面
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

function showKillSwitchStatus(config) {
  document.getElementById('killSwitchStatus').style.display = 'block';
  document.getElementById('enableToggle').checked = false;
  document.getElementById('enableToggle').disabled = true;
}

function startKillTimerIfNeeded(config) {
  if (!config.killSwitchActivated) return;
  
  function updateTimer() {
    const elapsed = Date.now() - config.killSwitchStartTime;
    const remaining = Math.max(0, config.killSwitchDuration - elapsed);
    
    if (remaining <= 0) {
      document.getElementById('killTimer').textContent = '✅ 可重新开启';
      document.getElementById('enableToggle').disabled = false;
      return;
    }
    
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    document.getElementById('killTimer').textContent = 
      `剩余: ${m}:${s.toString().padStart(2, '0')}`;
  }
  
  updateTimer();
  setInterval(updateTimer, 1000);
}

async function notifyContentScript(action) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { action }).catch(() => {});
  }
}