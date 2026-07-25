const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

// 인덱스 바에 노출할 대표 초성 (된소리 ㄲㄸㅃㅆㅉ는 이름 첫글자로 잘 안 쓰여서 제외)
export const CHOSUNG_INDEX = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

// "김철수" -> "ㄱㅊㅅ" 처럼 한글 음절을 초성으로 변환 (한글이 아닌 문자는 그대로 둠)
export function getChosung(str: string): string {
  let result = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code <= 11171) {
      result += CHOSUNG[Math.floor(code / 588)];
    } else {
      result += ch;
    }
  }
  return result;
}
