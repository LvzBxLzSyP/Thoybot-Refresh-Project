const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    function updateStatus() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 12 小時制格式
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const timeString = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm} | Taipei Standard Time`;

      // 每半小時對應的時鐘 emoji
      const clockEmojis = [
        '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
        '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'
      ];
      const emojiIndex = hours % 12 * 2 + Math.floor(minutes / 30);
      const clockEmoji = clockEmojis[emojiIndex];

      // 更新狀態
      client.user.setActivity(`${clockEmoji} ${timeString}`, { type: ActivityType.Custom });
    }

    // 計算距離下一分鐘0秒的時間
    function scheduleNextUpdate() {
      const now = new Date();
      const secondsUntilNextMinute = 60 - now.getSeconds();
      
      // 使用 setTimeout 在下一分鐘的0秒執行更新，之後每分鐘執行一次
      setTimeout(() => {
        updateStatus();
        setInterval(updateStatus, 60 * 1000);  // 每分鐘更新一次
      }, secondsUntilNextMinute * 1000);
    }

    // 啟動後立即設定第一次更新時間
    scheduleNextUpdate();
  },
};