let ads = [];
let config = {};

(async function init() {
  const result = await chrome.runtime.sendMessage({ action: 'getConfig' });
  config = result.config;
  ads = result.ads || [];
  
  renderPresetAds();
  renderCustomHtmlAds();
  bindEvents();
})();

function renderPresetAds() {
  const container = document.getElementById('presetAdList');
  container.innerHTML = ads.map((ad, index) => `
    <div class="ad-item">
      <div class="ad-item-info">
        <div class="ad-item-title">${ad.title}</div>
        <div class="ad-item-url">${ad.url}</div>
      </div>
      <div class="ad-item-actions">
        <button class="btn-sm btn-edit" data-index="${index}">编辑</button>
        <button class="btn-sm btn-delete" data-index="${index}">删除</button>
      </div>
    </div>
  `).join('');
  
  // 绑定编辑/删除事件
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      editAd(index);
    });
  });
  
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteAd(index);
    });
  });
}

function renderCustomHtmlAds() {
  const container = document.getElementById('customHtmlList');
  const customAds = ads.filter(ad => ad.htmlContent);
  
  container.innerHTML = customAds.map((ad, index) => {
    const globalIndex = ads.indexOf(ad);
    return `
      <div class="ad-item">
        <div class="ad-item-info">
          <div class="ad-item-title">${ad.title}</div>
          <div class="ad-item-url" style="font-family:monospace;font-size:11px;">${escapeHtml(ad.htmlContent.substring(0, 80))}...</div>
        </div>
        <div class="ad-item-actions">
          <button class="btn-sm btn-delete" data-index="${globalIndex}">删除</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteAd(index);
    });
  });
}

function editAd(index) {
  const ad = ads[index];
  const newTitle = prompt('编辑标题：', ad.title);
  if (newTitle !== null) {
    const newUrl = prompt('编辑 URL：', ad.url);
    if (newUrl !== null) {
      ads[index].title = newTitle;
      ads[index].url = newUrl;
      renderPresetAds();
      showStatus('已更新广告', 'success');
    }
  }
}

function deleteAd(index) {
  if (confirm(`确定删除 "${ads[index].title}"？`)) {
    ads.splice(index, 1);
    renderPresetAds();
    renderCustomHtmlAds();
    showStatus('已删除广告', 'success');
  }
}

function bindEvents() {
  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
  
  // 添加自定义 HTML 广告
  document.getElementById('addCustomHtmlBtn').addEventListener('click', () => {
    const title = document.getElementById('customTitle').value.trim();
    const html = document.getElementById('customHtml').value.trim();
    
    if (!title || !html) {
      showStatus('请填写标题和 HTML 内容', 'error');
      return;
    }
    
    ads.push({
      id: 'custom_' + Date.now(),
      title: title,
      url: '#',
      type: 'custom_html',
      htmlContent: html
    });
    
    document.getElementById('customTitle').value = '';
    document.getElementById('customHtml').value = '';
    renderCustomHtmlAds();
    showStatus('已添加自定义 HTML 广告', 'success');
  });
  
  // 添加普通广告
  document.getElementById('addNewAdBtn').addEventListener('click', () => {
    const title = document.getElementById('newAdTitle').value.trim();
    const url = document.getElementById('newAdUrl').value.trim();
    const type = document.getElementById('newAdType').value;
    
    if (!title || !url) {
      showStatus('请填写标题和 URL', 'error');
      return;
    }
    
    ads.push({
      id: 'ad_' + Date.now(),
      title: title,
      url: url,
      type: type
    });
    
    document.getElementById('newAdTitle').value = '';
    document.getElementById('newAdUrl').value = '';
    renderPresetAds();
    showStatus('已添加新广告', 'success');
  });
  
  // 保存
  document.getElementById('saveBtn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'saveAds', ads });
    showStatus('✅ 已保存所有更改！', 'success');
  });
  
  // 恢复默认
  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (confirm('确定恢复默认广告列表？这将覆盖所有自定义内容。')) {
      const defaultAds = [
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
        { id: 'ad11', title: '🖥️ 你的屏幕看起来很空虚', url: 'https://b23.tv/ihWz0GN', type: 'custom' },
        { id: 'ad12', title: '💀 最后亿个弹窗（才怪）', url: 'https://b23.tv/ANIS5b7', type: 'custom' }
      ];
      ads = defaultAds;
      await chrome.runtime.sendMessage({ action: 'saveAds', ads });
      renderPresetAds();
      renderCustomHtmlAds();
      showStatus('已恢复默认广告列表', 'success');
    }
  });
}

function showStatus(msg, type) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = type;
  setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}