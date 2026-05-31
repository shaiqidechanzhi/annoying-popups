// 默认配置
const DEFAULT_CONFIG = {
  enabled: true,
  frequency: 'random', // 'random' | 'every_click' | 'interval'
  intervalSeconds: 30,
  customAds: [],
  killSwitchActivated: false,
  killSwitchTimer: null
};

const PRESET_ADS = [
  {
    id: 'ad1',
    title: '衰气的船只的个人空间',
    url: 'https://b23.tv/ZVq7NTY',
    type: 'bilibili'
  },
  {
    id: 'ad2',
    title: '买完电脑后——我开始胡言乱语',
    url: 'https://b23.tv/ihWz0GN',
    type: 'bilibili'
  },
  {
    id: 'ad3',
    title: '人生中的第一台电脑，但只有300元，能干什么？',
    url: 'https://b23.tv/ANIS5b7',
    type: 'bilibili'
  },
  {
    id: 'ad4',
    title: '🔥震惊！你居然还没关注这个UP主？',
    url: 'https://b23.tv/ZVq7NTY',
    type: 'custom'
  },
  {
    id: 'ad5',
    title: '【紧急通知】你的电脑已被选中观看此视频',
    url: 'https://b23.tv/ihWz0GN',
    type: 'custom'
  },
  {
    id: 'ad6',
    title: '300元电脑挑战全网最低价！不看后悔',
    url: 'https://b23.tv/ANIS5b7',
    type: 'custom'
  },
  {
    id: 'ad7',
    title: '🤡 你被骗了！但这只是一个弹窗...',
    url: 'https://b23.tv/ZVq7NTY',
    type: 'custom'
  },
  {
    id: 'ad8',
    title: '⚠️ 系统警告：您的浏览器需要立即观看此视频',
    url: 'https://b23.tv/ihWz0GN',
    type: 'custom'
  },
  {
    id: 'ad9',
    title: '🎉 恭喜你中奖了！奖品是...这个弹窗',
    url: 'https://b23.tv/ANIS5b7',
    type: 'custom'
  },
  {
    id: 'ad10',
    title: '😈 魔鬼低语：点开这个链接吧...',
    url: 'https://b23.tv/ZVq7NTY',
    type: 'custom'
  },
  {
    id: 'ad11',
    title: '🖥️ 你的屏幕看起来很空虚，需要填充一个视频',
    url: 'https://b23.tv/ihWz0GN',
    type: 'custom'
  },
  {
    id: 'ad12',
    title: '💀 最后亿个弹窗（才怪）',
    url: 'https://b23.tv/ANIS5b7',
    type: 'custom'
  }
];

// 弹窗类型
const POPUP_TYPES = [
  'center-large',
  'center-medium',
  'center-small',
  'fullscreen',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'top-bar',
  'bottom-bar',
  'left-bar',
  'right-bar',
  'lock-screen',
  'horizontal-full',
  'corner-banner',
  'floating-random'
];

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ config: DEFAULT_CONFIG, ads: PRESET_ADS });
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getConfig') {
    chrome.storage.local.get(['config', 'ads'], (data) => {
      sendResponse({ config: data.config || DEFAULT_CONFIG, ads: data.ads || PRESET_ADS });
    });
    return true;
  }
  
  if (message.action === 'saveConfig') {
    chrome.storage.local.set({ config: message.config }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'saveAds') {
    chrome.storage.local.set({ ads: message.ads }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'killSwitch') {
    activateKillSwitch();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'cancelKillSwitch') {
    cancelKillSwitch();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'triggerPopup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showRandomPopup' });
      }
    });
    sendResponse({ success: true });
    return true;
  }
});

// 永久关闭 - 10分钟倒计时
function activateKillSwitch() {
  chrome.storage.local.get('config', (data) => {
    const config = data.config || DEFAULT_CONFIG;
    config.killSwitchActivated = true;
    config.killSwitchStartTime = Date.now();
    config.killSwitchDuration = 10 * 60 * 1000; // 10分钟
    config.enabled = false;
    chrome.storage.local.set({ config });
    
    // 10分钟后允许重新开启
    chrome.alarms.create('killSwitchAlarm', { delayInMinutes: 10 });
  });
}

function cancelKillSwitch() {
  chrome.storage.local.get('config', (data) => {
    const config = data.config || DEFAULT_CONFIG;
    config.killSwitchActivated = false;
    config.killSwitchStartTime = null;
    config.enabled = true;
    chrome.storage.local.set({ config });
    chrome.alarms.clear('killSwitchAlarm');
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'killSwitchAlarm') {
    chrome.storage.local.get('config', (data) => {
      const config = data.config || DEFAULT_CONFIG;
      config.killSwitchActivated = false;
      config.killSwitchStartTime = null;
      config.enabled = true;
      chrome.storage.local.set({ config });
    });
  }
});