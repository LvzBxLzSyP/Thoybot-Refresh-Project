function getClockEmoji(time) {
    const clockEmojis = [
        '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
        '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'
    ];
    const hour = time.hours() % 12; // 取 12 小時制
    const halfHour = time.minutes() >= 30 ? 1 : 0; // 判斷是否過半小時
    const emojiIndex = hour * 2 + halfHour; // 計算 emoji 索引
    return clockEmojis[emojiIndex];
}

module.exports = { getClockEmoji };