/**
 * 주어진 날짜를 현재 시각 기준으로 상대적인 시간으로 변환합니다.
 * @param date - Date 객체 또는 날짜 문자열
 * @returns 상대적인 시간 문자열 (예: "방금 전", "3분 전", "2시간 전")
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // 음수인 경우 (미래 시간)
  if (diffInSeconds < 0) {
    return '방금 전';
  }

  // 1분 미만
  if (diffInSeconds < 60) {
    return '방금 전';
  }

  // 1시간 미만 (분 단위)
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  // 1일 미만 (시간 단위)
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 1달 미만 (일 단위)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }

  // 1년 미만 (달 단위)
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}달 전`;
  }

  // 1년 이상 (년 단위)
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
}
