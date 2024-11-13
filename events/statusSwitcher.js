const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    let currentTimeZoneIndex = 0;
    const timeZones = [
      { name: 'Taipei Standard Time', timeZone: 'Asia/Taipei' },
      { name: 'Coordinated Universal Time', timeZone: 'UTC' },
      { name: 'Central European Time', timeZone: 'Europe/Berlin' },
      { name: 'Central Standard Time', timeZone: 'America/Chicago' }
    ];

    function updateStatus() {
      const now = new Date();
      const { name, timeZone } = timeZones[currentTimeZoneIndex];
      const timeInTimeZone = getTimeInTimeZone(now, timeZone);

      // 格式化时间字符串
      const timeString = formatTimeString(timeInTimeZone, name, timeZone);

      // 根据当前时间选择适当的时钟 emoji
      const clockEmoji = getClockEmoji(timeInTimeZone);

      // 更新状态
      client.user.setActivity(`${clockEmoji} ${timeString}`, { type: ActivityType.Custom });

      // 切换到下一个时区
      currentTimeZoneIndex = (currentTimeZoneIndex + 1) % timeZones.length;
    }

    function scheduleNextUpdate() {
      const now = new Date();
      // 计算距离下一个分钟开始的时间
      const timeToNextMinute = (60 - now.getSeconds()) * 1000;

      setTimeout(() => {
        // 每分钟更新一次时区索引
        currentTimeZoneIndex = 0;  // 每分钟重置为 0
        updateStatus();
        setInterval(updateStatus, 15 * 1000); // 每 15 秒更新一次
      }, timeToNextMinute); // 等待到下一分钟开始
    }

    // 获取指定时区的时间
    function getTimeInTimeZone(date, timeZone) {
      return new Date(date.toLocaleString('en-US', { timeZone }));
    }

    // 判斷是否為 DST
    function isDST(date, timeZone) {
      const january = new Date(Date.UTC(date.getUTCFullYear(), 0, 1)).toLocaleString("en-US", { timeZone });
      const current = date.toLocaleString("en-US", { timeZone });
      return new Date(january).getTimezoneOffset() !== new Date(current).getTimezoneOffset();
    }

    // 格式化时间字符串
    function formatTimeString(time, timeZoneName, timeZone) {
      const hour12 = time.getHours() % 12 || 12;
      const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
      const isDSTActive = isDST(time, timeZone); // 檢查是否為 DST

      switch (timeZoneName) {
        case 'Central European Time':
          return `${hour12.toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')} ${ampm} | ${isDSTActive ? 'Central European Summer Time' : 'Central European Time'}`;
        case 'Central Standard Time':
          return `${hour12.toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')} ${ampm} | ${isDSTActive ? 'Central Daylight Time' : 'Central Standard Time'}`;
        default:
          return `${hour12.toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')} ${ampm} | ${timeZoneName}`;
      }
    }

    // 根据时间选择适当的时钟 emoji
    function getClockEmoji(time) {
      const clockEmojis = [
        '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
        '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'
      ];
      const emojiIndex = time.getHours() % 12 * 2 + Math.floor(time.getMinutes() / 30);
      return clockEmojis[emojiIndex];
    }

    scheduleNextUpdate();
  },
};