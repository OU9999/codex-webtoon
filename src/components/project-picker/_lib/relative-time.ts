const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const isKoreanLanguage = (language: string): boolean => {
  return language.toLowerCase().startsWith('ko');
};

const formatRelativeTime = (epochMs: number, language: string): string => {
  if (!Number.isFinite(epochMs)) return '';

  const isKo = isKoreanLanguage(language);
  const diff = Date.now() - epochMs;
  if (diff < MINUTE) return isKo ? '방금 전' : 'just now';
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    if (isKo) return `${mins}분 전`;

    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    if (isKo) return `${hours}시간 전`;

    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < 2 * DAY) return isKo ? '어제' : 'yesterday';
  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    if (isKo) return `${days}일 전`;

    return `${days} days ago`;
  }

  const date = new Date(epochMs);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(isKo ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

export { formatRelativeTime };
