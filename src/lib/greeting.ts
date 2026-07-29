// 홈 화면 맨 위에 보여줄 에너지 넘치는 인사 문구. 요일/계절에 맞춰 고르되,
// 같은 날에는 새로고침해도 문구가 안 바뀌도록 날짜 기반으로 고정해서 고른다.

const GENERIC = [
  "{name}님, 오늘도 힘내세요! 💪",
  "{name}님, 오늘 하루도 파이팅입니다! 🔥",
  "좋은 아침이에요 {name}님, 오늘도 활기차게 시작해봐요!",
  "{name}님, 오늘도 최고의 하루 만들어봐요! ✨",
  "{name}님, 오늘도 웃으며 힘차게 가봅시다!",
];

const WEEKDAY: Record<number, string[]> = {
  1: ["{name}님, 활기찬 월요일! 이번 주도 힘차게 시작해요 🔥", "월요일 아침, {name}님 오늘도 에너지 뿜뿜하세요!"],
  5: ["{name}님, 불금이에요! 오늘 하루만 힘내면 주말입니다 🎉", "금요일! {name}님 마지막 스퍼트 화이팅입니다!"],
};

const SEASON: Record<number, string[]> = {
  // 겨울 12,1,2
  12: ["쌀쌀한 날씨에도 {name}님 마음만은 따뜻하게, 오늘도 화이팅!", "추운 날씨엔 든든한 옷차림으로, {name}님 오늘도 힘내세요!"],
  1: ["새해 기운 가득한 {name}님, 오늘도 힘차게!", "추운 날씨, 따뜻하게 입으시고 오늘도 파이팅하세요 {name}님!"],
  2: ["봄이 머지않았어요, {name}님 조금만 더 힘내요!", "쌀쌀하지만 {name}님 마음은 이미 봄날, 오늘도 화이팅!"],
  // 봄 3,4,5
  3: ["봄바람 살랑살랑, {name}님 기분 좋게 시작해봐요!", "따뜻한 봄날, {name}님 오늘도 활짝 웃는 하루 되세요!"],
  4: ["꽃 피는 계절이에요, {name}님 오늘도 산뜻하게 화이팅!", "화창한 봄날, {name}님 오늘도 힘차게 달려봐요!"],
  5: ["싱그러운 5월, {name}님 오늘도 에너지 가득하세요!", "완연한 봄, {name}님 오늘 하루도 활기차게!"],
  // 여름 6,7,8
  6: ["장마철이지만 {name}님 마음은 맑음! 오늘도 화이팅!", "습한 날씨에도 {name}님 컨디션은 최상으로, 오늘도 힘내세요!"],
  7: ["무더운 여름, {name}님 시원하게 힘내서 달려봐요! ☀️", "더위에 지치지 마세요 {name}님, 오늘 하루도 파이팅입니다!"],
  8: ["한여름 무더위 속에서도 {name}님 열정은 그대로! 오늘도 화이팅!", "더운 날씨엔 시원한 마음으로, {name}님 오늘도 힘내세요!"],
  // 가을 9,10,11
  9: ["선선한 바람이 반가운 계절, {name}님 오늘도 상쾌하게 시작해요!", "가을 문턱, {name}님 오늘도 활기차게 달려봐요!"],
  10: ["단풍처럼 알록달록 즐거운 하루 되세요 {name}님!", "선선한 가을날, {name}님 오늘도 힘차게 파이팅!"],
  11: ["쌀쌀해지는 날씨, 옷 든든히 입으시고 오늘도 화이팅 {name}님!", "가을이 깊어가네요, {name}님 오늘 하루도 힘내세요!"],
};

const BIRTHDAY = [
  "🎉 {name}님, 생일 축하드려요! 오늘 하루도 축하 가득한 날 되세요!",
  "🎂 {name}님, 태어나신 걸 축하해요! 오늘만큼은 자신에게도 힘내라고 말해주세요!",
  "🎈 생일 축하드립니다 {name}님! 오늘 하루 더 특별하고 힘차게 보내세요!",
];

function dateSeed(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getEnergeticGreeting(
  userName: string | null,
  now: Date = new Date(),
  birthDate: Date | null = null,
): string {
  const name = userName ?? "설계사";
  const seed = dateSeed(now);

  if (birthDate && birthDate.getMonth() === now.getMonth() && birthDate.getDate() === now.getDate()) {
    return BIRTHDAY[seed % BIRTHDAY.length].replace(/\{name\}/g, name);
  }

  const month = now.getMonth() + 1;
  const weekday = now.getDay();
  const pool = [...GENERIC, ...(SEASON[month] ?? []), ...(WEEKDAY[weekday] ?? [])];
  const picked = pool[seed % pool.length];
  return picked.replace(/\{name\}/g, name);
}
