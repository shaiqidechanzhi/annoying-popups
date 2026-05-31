// ==================== 烦人弹窗 - 完整内容脚本 ====================

let config = null;
let ads = [];
let popupStack = [];
let popupIdCounter = 0;
let clickListenerAttached = false;
let intervalTimer = null;
let killSwitchTimerInterval = null;
let clickCount = 0;

// ==================== 初始化 ====================

(async function init() {
  const result = await chrome.runtime.sendMessage({ action: 'getConfig' });
  config = result.config || { enabled: true, frequency: 'every_click', intervalSeconds: 30, killSwitchActivated: false };
  ads = result.ads || [];

  if (ads.length === 0) {
    ads = getDefaultAds();
  }

  if (config.enabled !== false) {
    attachListeners();
    if (config.frequency === 'interval') {
      startInterval();
    }
  }

  if (config.killSwitchActivated) {
    showKillSwitchBanner();
    startKillSwitchTimer();
  }

  console.log('😈 烦人弹窗插件已就绪！');
})();

function getDefaultAds() {
  return [
    { id: 'ad1', title: '衰气的船只的个人空间', url: 'https://b23.tv/ZVq7NTY', type: 'bilibili' },
    { id: 'ad2', title: '买完电脑后——我开始胡言乱语', url: 'https://b23.tv/ihWz0GN', type: 'bilibili' },
    { id: 'ad3', title: '人生中的第一台电脑，但只有300元', url: 'https://b23.tv/ANIS5b7', type: 'bilibili' },
    { id: 'ad4', title: '🔥震惊！你居然还没关注这个UP主？', url: 'https://b23.tv/ZVq7NTY', type: 'custom' },
    { id: 'ad5', title: '【紧急通知】你的电脑已被选中观看此视频', url: 'https://b23.tv/ihWz0GN', type: 'custom' },
    { id: 'ad6', title: '300元电脑挑战全网最低价！不看后悔', url: 'https://b23.tv/ANIS5b7', type: 'custom' },
    { id: 'ad7', title: '🤡 你被骗了！但这只是一个弹窗...', url: 'https://b23.tv/ZVq7NTY', type: 'custom' },
    { id: 'ad8', title: '⚠️ 系统警告：您的浏览器需要立即观看此视频', url: 'https://b23.tv/ihWz0GN', type: 'custom' },
    { id: 'ad9', title: '🎉 恭喜你中奖了！奖品是...这个弹窗', url: 'https://b23.tv/ANIS5b7', type: 'custom' },
    { id: 'ad10', title: '😈 魔鬼低语：点开这个链接吧...', url: 'https://b23.tv/ZVq7NTY', type: 'custom' },
    { id: 'ad11', title: '🖥️ 你的屏幕看起来很空虚，需要填充一个视频', url: 'https://b23.tv/ihWz0GN', type: 'custom' },
    { id: 'ad12', title: '💀 最后亿个弹窗（才怪）', url: 'https://b23.tv/ANIS5b7', type: 'custom' },
  ];
}

// ==================== 消息监听 ====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showRandomPopup') {
    showRandomPopup();
    sendResponse({ success: true });
  }
  if (message.action === 'configUpdated') {
    loadConfig();
    sendResponse({ success: true });
  }
});

async function loadConfig() {
  const result = await chrome.runtime.sendMessage({ action: 'getConfig' });
  config = result.config || config;
  ads = result.ads || ads;

  if (config.enabled !== false && !config.killSwitchActivated) {
    attachListeners();
  } else {
    detachListeners();
    stopInterval();
  }

  if (config.frequency === 'interval' && config.enabled !== false) {
    startInterval();
  } else {
    stopInterval();
  }

  if (config.killSwitchActivated) {
    showKillSwitchBanner();
    startKillSwitchTimer();
  } else {
    removeKillSwitchBanner();
    stopKillSwitchTimer();
  }
}

// ==================== 事件监听 ====================

function attachListeners() {
  if (clickListenerAttached) return;
  document.addEventListener('click', onUserClick, true);
  document.addEventListener('keydown', onUserKeydown, true);
  document.addEventListener('scroll', onUserScroll, { passive: true });
  document.addEventListener('mousemove', onUserMouseMove, { passive: true, once: true });
  clickListenerAttached = true;
}

function detachListeners() {
  document.removeEventListener('click', onUserClick, true);
  document.removeEventListener('keydown', onUserKeydown, true);
  document.removeEventListener('scroll', onUserScroll);
  document.removeEventListener('mousemove', onUserMouseMove);
  clickListenerAttached = false;
}

function isPopupElement(el) {
  return el.closest('.annoying-popup-overlay') ||
         el.closest('.kill-switch-banner') ||
         el.closest('.popup-close-steps');
}

function shouldTrigger() {
  if (!config || config.enabled === false) return false;
  if (config.killSwitchActivated) return false;
  if (config.frequency === 'every_click') return true;
  if (config.frequency === 'random') return Math.random() < 0.6;
  return false;
}

function onUserClick(e) {
  if (isPopupElement(e.target)) return;
  if (shouldTrigger()) {
    clickCount++;
    showRandomPopup();
  }
}

function onUserKeydown(e) {
  if (isPopupElement(e.target)) return;
  if (shouldTrigger() && Math.random() < 0.35) {
    showRandomPopup();
  }
}

function onUserScroll() {
  if (shouldTrigger() && Math.random() < 0.12) {
    showRandomPopup();
  }
}

function onUserMouseMove() {
  document.addEventListener('mousemove', onUserMouseMove, { passive: true, once: true });
  if (shouldTrigger() && Math.random() < 0.04) {
    showRandomPopup();
  }
}

function startInterval() {
  stopInterval();
  intervalTimer = setInterval(() => {
    if (config.enabled !== false && !config.killSwitchActivated) {
      showRandomPopup();
    }
  }, (config.intervalSeconds || 30) * 1000);
}

function stopInterval() {
  if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null; }
}

// ==================== 弹窗生成 ====================

function showRandomPopup() {
  if (!config || config.enabled === false || config.killSwitchActivated) return;
  const type = getRandomType();
  const ad = getRandomAd();
  createPopup(type, ad);
}

function getRandomType() {
  const types = [
    'center-large', 'center-medium', 'center-small',
    'fullscreen', 'top-left', 'top-right', 'bottom-left', 'bottom-right',
    'top-bar', 'bottom-bar', 'left-bar', 'right-bar',
    'lock-screen', 'horizontal-full', 'corner-banner', 'floating-random'
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomAd() {
  if (!ads || ads.length === 0) {
    return { title: '默认广告', url: 'https://b23.tv/ZVq7NTY', type: 'bilibili' };
  }
  return ads[Math.floor(Math.random() * ads.length)];
}

function createPopup(type, ad) {
  const id = ++popupIdCounter;
  const overlay = document.createElement('div');
  overlay.className = `annoying-popup-overlay annoying-popup-${type}`;
  overlay.id = `annoying-popup-${id}`;
  overlay.setAttribute('data-popup-id', id);

  let html = '';
  if (ad.htmlContent) {
    html = buildCustomHtmlPopup(ad, id);
  } else {
    html = buildPopupByType(type, ad, id);
  }

  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('annoying-popup-visible');
  });

  popupStack.push({ id, overlay, type });

  // 超过 6 个弹窗就自动关最旧的
  while (popupStack.length > 6) {
    const oldest = popupStack.shift();
    if (oldest && oldest.overlay && oldest.overlay.parentNode) {
      oldest.overlay.classList.add('annoying-popup-hiding');
      setTimeout(() => {
        if (oldest.overlay.parentNode) oldest.overlay.parentNode.removeChild(oldest.overlay);
      }, 250);
    }
  }

  bindCloseHandlers(overlay, id);
  if (type === 'floating-random') animateFloating(overlay);
}

// ==================== 弹窗模板 ====================

function buildPopupByType(type, ad, id) {
  switch (type) {
    case 'fullscreen':     return buildFullscreen(ad, id);
    case 'lock-screen':    return buildLockScreen(ad, id);
    case 'horizontal-full':return buildHorizontalFull(ad, id);
    case 'center-large':   return buildCenter(ad, id, 'large');
    case 'center-medium':  return buildCenter(ad, id, 'medium');
    case 'center-small':   return buildCenter(ad, id, 'small');
    case 'top-bar':        return buildBar(ad, id, 'top');
    case 'bottom-bar':     return buildBar(ad, id, 'bottom');
    case 'left-bar':       return buildBar(ad, id, 'left');
    case 'right-bar':      return buildBar(ad, id, 'right');
    case 'top-left':       return buildCorner(ad, id, 'top-left');
    case 'top-right':      return buildCorner(ad, id, 'top-right');
    case 'bottom-left':    return buildCorner(ad, id, 'bottom-left');
    case 'bottom-right':   return buildCorner(ad, id, 'bottom-right');
    case 'corner-banner':  return buildCornerBanner(ad, id);
    case 'floating-random':return buildFloating(ad, id);
    default:               return buildCenter(ad, id, 'medium');
  }
}

function buildFullscreen(ad, id) {
  return `
    <div class="popup-fullscreen">
      <div class="popup-fullscreen-content">
        <div class="popup-icon">📢</div>
        <h1 class="popup-title-xl">${ad.title}</h1>
        <a href="${ad.url}" target="_blank" class="popup-link-xl">🔗 ${ad.url}</a>
        <p class="popup-subtitle">全屏弹窗 · 毛玻璃质感 · 是不是很烦？😈</p>
        <div class="popup-close-area">
          <button class="popup-close-btn popup-close-main" data-popup-id="${id}">关闭此弹窗（需验证）</button>
        </div>
      </div>
    </div>`;
}

function buildLockScreen(ad, id) {
  return `
    <div class="popup-lockscreen">
      <div class="popup-lockscreen-inner">
        <div class="popup-icon">🔒</div>
        <h2 style="color:#e0e0e0;">屏幕已锁定</h2>
        <p style="font-size:17px;margin:12px 0;color:#ccc;">${ad.title}</p>
        <a href="${ad.url}" target="_blank" class="popup-link-xl">🔗 ${ad.url}</a>
        <p style="color:#999;margin:16px 0;">⚠️ 完成验证即可解锁</p>
        <div class="popup-close-area">
          <button class="popup-close-btn popup-close-main" data-popup-id="${id}">解锁屏幕（需验证）</button>
        </div>
      </div>
    </div>`;
}

function buildHorizontalFull(ad, id) {
  return `
    <div class="popup-horizontal-full">
      <div class="popup-horizontal-content">
        <span class="popup-icon-inline">📢</span>
        <span class="popup-title-inline">${ad.title}</span>
        <a href="${ad.url}" target="_blank" class="popup-link-inline">🔗 打开</a>
        <button class="popup-close-btn popup-close-main" data-popup-id="${id}" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#ccc;width:30px;height:30px;border-radius:50%;font-size:16px;cursor:pointer;">×</button>
      </div>
    </div>`;
}

function buildCenter(ad, id, size) {
  const emojis = ['😈','👻','🤡','💀','🎃','👾','🤖','🐲','🔥','⚠️','📢','💬'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return `
    <div class="popup-center popup-center-${size}">
      <div class="popup-center-header"><span>${emoji} 通知 ${emoji}</span></div>
      <div class="popup-center-body">
        <p class="popup-center-title">${ad.title}</p>
        <a href="${ad.url}" target="_blank" class="popup-link">🔗 ${ad.url}</a>
        <p class="popup-center-hint">（链接可点击打开）</p>
      </div>
      <div class="popup-center-footer">
        <button class="popup-close-btn popup-close-main" data-popup-id="${id}">关闭（需验证）</button>
      </div>
    </div>`;
}

function buildBar(ad, id, pos) {
  return `
    <div class="popup-bar popup-bar-${pos}">
      <div class="popup-bar-content">
        <span>📢 ${ad.title}</span>
        <a href="${ad.url}" target="_blank" class="popup-link-inline">🔗 查看</a>
        <button class="popup-close-btn popup-close-main popup-bar-close" data-popup-id="${id}">×</button>
      </div>
    </div>`;
}

function buildCorner(ad, id, pos) {
  return `
    <div class="popup-corner popup-corner-${pos}">
      <div class="popup-corner-content">
        <p style="margin-bottom:8px;"><strong>${ad.title}</strong></p>
        <a href="${ad.url}" target="_blank" style="color:#8cb8e0;">🔗 点击查看</a>
        <button class="popup-close-btn popup-close-main popup-corner-close" data-popup-id="${id}">×</button>
      </div>
    </div>`;
}

function buildCornerBanner(ad, id) {
  const positions = ['top-left','top-right','bottom-left','bottom-right'];
  const pos = positions[Math.floor(Math.random() * positions.length)];
  return `
    <div class="popup-corner-banner popup-corner-banner-${pos}">
      <div class="popup-corner-banner-content">
        <span>🔥 ${ad.title}</span>
        <a href="${ad.url}" target="_blank" style="color:#333;background:rgba(255,255,255,0.85);padding:4px 12px;border-radius:12px;text-decoration:none;font-weight:600;">去看看</a>
        <button class="popup-close-btn popup-close-main" data-popup-id="${id}" style="background:transparent;border:none;color:#bbb;font-size:18px;cursor:pointer;">×</button>
      </div>
    </div>`;
}

function buildFloating(ad, id) {
  const colors = ['#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#20c997'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `
    <div class="popup-floating" style="border-color:${color};">
      <div class="popup-floating-header" style="background:${color};color:#1a1a1a;">
        <span>📢 浮动广告</span>
        <button class="popup-close-btn popup-close-main popup-floating-close" data-popup-id="${id}" style="color:#1a1a1a;">×</button>
      </div>
      <div class="popup-floating-body">
        <p style="margin-bottom:10px;"><strong>${ad.title}</strong></p>
        <a href="${ad.url}" target="_blank" style="color:#8cb8e0;">🔗 点击访问</a>
      </div>
    </div>`;
}

function buildCustomHtmlPopup(ad, id) {
  return `
    <div class="popup-custom-wrapper">
      ${ad.htmlContent}
      <div class="popup-custom-close-area">
        <button class="popup-close-btn popup-close-main" data-popup-id="${id}"
          style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.12);color:#ccc;border:1px solid rgba(255,255,255,0.2);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;z-index:9999;">×</button>
      </div>
    </div>`;
}

// ==================== 关闭按钮绑定 ====================

function bindCloseHandlers(overlay, id) {
  overlay.querySelectorAll('.popup-close-main').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startVerification(overlay, id);
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      startVerification(overlay, id);
    }
  });
}

// ==================== 验证系统（核心） ====================

function startVerification(overlay, id) {
  const types = ['captcha', 'math', 'slider', 'typewrite', 'reverse', 'memory'];
  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'captcha':  showCaptcha(overlay, id); break;
    case 'math':     showMath(overlay, id); break;
    case 'slider':   showSlider(overlay, id); break;
    case 'typewrite':showTypewrite(overlay, id); break;
    case 'reverse':  showReverse(overlay, id); break;
    case 'memory':   showMemory(overlay, id); break;
  }
}

// --- 公共：创建验证弹窗容器 ---
function createVerifyBox(overlay, id) {
  const old = overlay.querySelector('.popup-close-steps');
  if (old) old.remove();

  const box = document.createElement('div');
  box.className = 'popup-close-steps';
  box.innerHTML = '<div class="popup-close-steps-overlay"><div class="popup-close-steps-dialog"></div></div>';
  overlay.appendChild(box);
  return box.querySelector('.popup-close-steps-dialog');
}

function finishVerify(overlay, id) {
  const box = overlay.querySelector('.popup-close-steps');
  if (box) box.remove();
  overlay.classList.remove('annoying-popup-visible');
  overlay.classList.add('annoying-popup-hiding');
  setTimeout(() => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    popupStack = popupStack.filter(p => p.id !== id);
  }, 250);
}

function randomStr(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// --- 1. 验证码 ---
function showCaptcha(overlay, id) {
  const code = randomStr(4);
  const d = createVerifyBox(overlay, id);
  d.innerHTML = `
    <p style="font-size:16px;margin-bottom:8px;">🤖 请输入验证码</p>
    <div class="popup-verify-code-display">${code}</div>
    <input class="popup-verify-input" id="vi-${id}" placeholder="输入验证码" maxlength="4" autocomplete="off">
    <p class="popup-verify-error" id="ve-${id}" style="display:none;">❌ 错误，已刷新验证码</p>
    <div class="popup-close-steps-buttons">
      <button class="popup-step-btn popup-step-final" id="vs-${id}">✅ 确认</button>
      <button class="popup-step-btn popup-step-cancel" id="vc-${id}">算了</button>
    </div>`;

  const input = d.querySelector(`#vi-${id}`);
  const errEl = d.querySelector(`#ve-${id}`);
  let currentCode = code;

  d.querySelector(`#vs-${id}`).addEventListener('click', (e) => {
    e.stopPropagation();
    if (input.value.toUpperCase() === currentCode) {
      finishVerify(overlay, id);
    } else {
      errEl.style.display = 'block';
      input.value = '';
      currentCode = randomStr(4);
      d.querySelector('.popup-verify-code-display').textContent = currentCode;
      input.focus();
    }
  });

  d.querySelector(`#vc-${id}`).addEventListener('click', (e) => {
    e.stopPropagation(); d.parentElement.parentElement.remove();
  });

  input.focus();
}

// --- 2. 数学题 ---
function showMath(overlay, id) {
  const ops = [
    { s: '+', f: (a,b)=>a+b },
    { s: '×', f: (a,b)=>a*b },
    { s: '-', f: (a,b)=>a-b },
  ];
  const op = ops[Math.floor(Math.random()*ops.length)];
  const a = Math.floor(Math.random()*40)+10;
  const b = Math.floor(Math.random()*15)+3;
  const ans = op.f(a,b);

  const d = createVerifyBox(overlay, id);
  d.innerHTML = `
    <p style="font-size:16px;">🧮 请计算：</p>
    <p style="font-size:30px;font-weight:bold;margin:14px 0;color:#ffd93d;">${a} ${op.s} ${b} = ?</p>
    <input class="popup-verify-input" id="mi-${id}" type="number" placeholder="输入答案" autocomplete="off">
    <p class="popup-verify-error" id="me-${id}" style="display:none;">❌ 答案不对</p>
    <div class="popup-close-steps-buttons">
      <button class="popup-step-btn popup-step-final" id="ms-${id}">✅ 提交</button>
      <button class="popup-step-btn popup-step-cancel" id="mc-${id}">不算了</button>
    </div>`;

  const input = d.querySelector(`#mi-${id}`);
  const errEl = d.querySelector(`#me-${id}`);

  const check = () => {
    if (parseInt(input.value) === ans) {
      finishVerify(overlay, id);
    } else {
      errEl.style.display = 'block';
      input.value = '';
      input.focus();
    }
  };

  d.querySelector(`#ms-${id}`).addEventListener('click', (e) => { e.stopPropagation(); check(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); check(); } });
  d.querySelector(`#mc-${id}`).addEventListener('click', (e) => { e.stopPropagation(); d.parentElement.parentElement.remove(); });
  input.focus();
}

// --- 3. 滑块 ---
function showSlider(overlay, id) {
  const d = createVerifyBox(overlay, id);
  d.innerHTML = `
    <p style="font-size:15px;">👉 拖动滑块到最右边</p>
    <div style="margin:16px 0;position:relative;height:48px;background:rgba(255,255,255,0.06);border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);" id="sl-${id}">
      <div id="st-${id}" style="position:absolute;top:0;left:0;height:100%;width:0%;background:rgba(100,200,130,0.2);border-radius:24px;"></div>
      <div id="sh-${id}" style="position:absolute;top:3px;left:3px;width:42px;height:42px;background:rgba(255,255,255,0.9);border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:18px;user-select:none;box-shadow:0 2px 10px rgba(0,0,0,0.3);color:#333;">→</div>
    </div>
    <p id="ss-${id}" style="font-size:12px;color:#888;">拖动滑块...</p>
    <div class="popup-close-steps-buttons">
      <button class="popup-step-btn popup-step-cancel" id="sc-${id}">不关了</button>
    </div>`;

  const container = d.querySelector(`#sl-${id}`);
  const thumb = d.querySelector(`#sh-${id}`);
  const track = d.querySelector(`#st-${id}`);
  const status = d.querySelector(`#ss-${id}`);

  let dragging = false, startX = 0, startLeft = 0;
  const maxLeft = container.clientWidth - 48;

  const onStart = (cx) => {
    dragging = true;
    startX = cx;
    startLeft = thumb.offsetLeft;
    thumb.style.transition = 'none';
    track.style.transition = 'none';
    thumb.style.cursor = 'grabbing';
  };

  const onMove = (cx) => {
    if (!dragging || !d.parentElement) return;
    const dx = cx - startX;
    const nl = Math.max(3, Math.min(startLeft + dx, maxLeft));
    thumb.style.left = nl + 'px';
    const pct = Math.round((nl - 3) / maxLeft * 100);
    track.style.width = pct + '%';
    status.textContent = pct >= 100 ? '✅ 验证通过！' : `进度 ${pct}%`;
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    thumb.style.cursor = 'grab';
    const pct = Math.round((thumb.offsetLeft - 3) / maxLeft * 100);
    if (pct >= 98) {
      thumb.style.left = maxLeft + 'px';
      track.style.width = '100%';
      status.textContent = '✅ 验证通过！';
      setTimeout(() => finishVerify(overlay, id), 350);
    } else {
      thumb.style.transition = 'left 0.35s ease';
      track.style.transition = 'width 0.35s ease';
      thumb.style.left = '3px';
      track.style.width = '0%';
      status.textContent = '😅 没拖到位，重来';
    }
  };

  thumb.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); onStart(e.clientX); });
  document.addEventListener('mousemove', (e) => onMove(e.clientX));
  document.addEventListener('mouseup', onEnd);
  thumb.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); onStart(e.touches[0].clientX); });
  document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX));
  document.addEventListener('touchend', onEnd);

  d.querySelector(`#sc-${id}`).addEventListener('click', (e) => {
    e.stopPropagation(); d.parentElement.parentElement.remove();
  });
}

// --- 4. 打字确认 ---
function showTypewrite(overlay, id) {
  const phrases = ['我确定要关闭','关闭这个广告','我不想看了','请关闭弹窗','确认关闭广告','让我离开'];
  const phrase = phrases[Math.floor(Math.random()*phrases.length)];

  const d = createVerifyBox(overlay, id);
  d.innerHTML = `
    <p style="font-size:15px;">⌨️ 请输入下方文字：</p>
    <p style="font-size:22px;font-weight:bold;margin:12px 0;color:#ffd93d;">「${phrase}」</p>
    <input class="popup-verify-input" id="ti-${id}" placeholder="${phrase}" autocomplete="off">
    <p class="popup-verify-error" id="te-${id}" style="display:none;">❌ 输入不匹配</p>
    <div class="popup-close-steps-buttons">
      <button class="popup-step-btn popup-step-final" id="ts-${id}">✅ 确认</button>
      <button class="popup-step-btn popup-step-cancel" id="tc-${id}">不关了</button>
    </div>`;

  const input = d.querySelector(`#ti-${id}`);
  const errEl = d.querySelector(`#te-${id}`);

  const check = () => {
    if (input.value.trim() === phrase) {
      finishVerify(overlay, id);
    } else {
      errEl.style.display = 'block';
    }
  };

  d.querySelector(`#ts-${id}`).addEventListener('click', (e) => { e.stopPropagation(); check(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); check(); } });
  d.querySelector(`#tc-${id}`).addEventListener('click', (e) => { e.stopPropagation(); d.parentElement.parentElement.remove(); });
  input.focus();
}

// --- 5. 逆向心理学 ---
function showReverse(overlay, id) {
  const d = createVerifyBox(overlay, id);
  d.innerHTML = `
    <p style="font-size:16px;">😏 你真的想关闭吗？</p>
    <p style="color:#888;margin:8px 0;">请选择正确的按钮</p>
    <div class="popup-close-steps-buttons" id="rb-${id}"></div>`;

  const container = d.querySelector(`#rb-${id}`);
  const swap = Math.random() > 0.5;

  const btns = [
    { label: swap ? '是的，关闭它' : '不，我要留着', correct: !swap, cls: 'popup-step-final' },
    { label: swap ? '不，我要留着' : '是的，关闭它', correct: swap, cls: 'popup-step-cancel' },
    { label: '我再想想...', correct: false, cls: 'popup-step-cancel' },
  ];
  btns.sort(() => Math.random() - 0.5);

  btns.forEach(b => {
    const el = document.createElement('button');
    el.className = `popup-step-btn ${b.cls}`;
    el.textContent = b.label;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (b.correct) {
        finishVerify(overlay, id);
      } else {
        d.parentElement.parentElement.remove();
        showReverse(overlay, id); // 重新来，更迷惑
      }
    });
    container.appendChild(el);
  });
}

// --- 6. 记忆数字 ---
function showMemory(overlay, id) {
  const digits = Array.from({length:5}, () => Math.floor(Math.random()*10));
  const answer = digits.join('');

  const d = createVerifyBox(overlay, id);
  d.innerHTML = `
    <p style="font-size:15px;">🧠 记住这串数字（3秒后消失）：</p>
    <p style="font-size:36px;font-weight:bold;margin:12px 0;color:#ffd93d;letter-spacing:6px;" id="md-${id}">${answer}</p>
    <p style="color:#888;font-size:12px;" id="mh-${id}">正在显示...</p>
    <div id="miw-${id}" style="display:none;">
      <input class="popup-verify-input" id="mmi-${id}" placeholder="输入你记住的数字" maxlength="5" autocomplete="off">
      <p class="popup-verify-error" id="mme-${id}" style="display:none;">❌ 记错啦</p>
      <div class="popup-close-steps-buttons">
        <button class="popup-step-btn popup-step-final" id="mms-${id}">✅ 提交</button>
        <button class="popup-step-btn popup-step-cancel" id="mmc-${id}">算了</button>
      </div>
    </div>`;

  setTimeout(() => {
    const disp = d.querySelector(`#md-${id}`);
    const hint = d.querySelector(`#mh-${id}`);
    const wrapper = d.querySelector(`#miw-${id}`);
    if (disp) disp.style.display = 'none';
    if (hint) hint.textContent = '数字已隐藏，请输入：';
    if (wrapper) wrapper.style.display = 'block';
    const input = d.querySelector(`#mmi-${id}`);
    if (input) input.focus();
  }, 3000);

  d.querySelector(`#mms-${id}`).addEventListener('click', (e) => {
    e.stopPropagation();
    const input = d.querySelector(`#mmi-${id}`);
    if (input && input.value.trim() === answer) {
      finishVerify(overlay, id);
    } else {
      const errEl = d.querySelector(`#mme-${id}`);
      if (errEl) errEl.style.display = 'block';
      if (input) { input.value = ''; input.focus(); }
    }
  });

  d.querySelector(`#mmc-${id}`).addEventListener('click', (e) => {
    e.stopPropagation(); d.parentElement.parentElement.remove();
  });
}

// ==================== 浮动动画 ====================

function animateFloating(overlay) {
  let x = Math.random() * (window.innerWidth - 320);
  let y = Math.random() * (window.innerHeight - 200);
  let dx = (Math.random() - 0.5) * 3.5;
  let dy = (Math.random() - 0.5) * 3.5;

  const el = overlay.querySelector('.popup-floating');
  if (!el) return;

  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.background = 'transparent';

  el.style.position = 'fixed';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.pointerEvents = 'auto';

  function step() {
    if (!overlay.parentNode) return;
    x += dx; y += dy;
    if (x <= 0 || x >= window.innerWidth - 320) dx *= -1;
    if (y <= 0 || y >= window.innerHeight - 200) dy *= -1;
    x = Math.max(0, Math.min(x, window.innerWidth - 320));
    y = Math.max(0, Math.min(y, window.innerHeight - 200));
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ==================== 永久关闭横幅 ====================

function showKillSwitchBanner() {
  if (document.querySelector('.kill-switch-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'kill-switch-banner';
  banner.innerHTML = `
    <div class="kill-switch-content">
      <span>🔕 弹窗已永久关闭</span>
      <span class="kill-switch-timer" id="kill-switch-timer">--:--</span>
      <button class="kill-switch-cancel-btn" id="kill-switch-cancel">取消关闭</button>
    </div>`;
  document.body.appendChild(banner);
  document.getElementById('kill-switch-cancel').addEventListener('click', () => {
    if (confirm('确定取消永久关闭？弹窗将恢复。')) {
      chrome.runtime.sendMessage({ action: 'cancelKillSwitch' });
    }
  });
}

function removeKillSwitchBanner() {
  const b = document.querySelector('.kill-switch-banner');
  if (b) b.remove();
}

function startKillSwitchTimer() {
  stopKillSwitchTimer();
  updateKillTimer();
  killSwitchTimerInterval = setInterval(updateKillTimer, 1000);
}

function stopKillSwitchTimer() {
  if (killSwitchTimerInterval) { clearInterval(killSwitchTimerInterval); killSwitchTimerInterval = null; }
}

function updateKillTimer() {
  const el = document.getElementById('kill-switch-timer');
  if (!el || !config || !config.killSwitchActivated) return;
  const remaining = Math.max(0, (config.killSwitchDuration || 600000) - (Date.now() - config.killSwitchStartTime));
  if (remaining <= 0) { el.textContent = '✅ 可重新开启'; stopKillSwitchTimer(); return; }
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}