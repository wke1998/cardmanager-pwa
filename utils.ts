/**
 * 根據信用卡的結帳日，計算「本期帳單」的起始日期。
 * 例如：結帳日為 5 日。
 * - 若今天為 10/10，則本期起始日為 10/6。
 * - 若今天為 10/3，則本期起始日為 9/6。
 */
export function getCurrentCycleStartDate(statementDate: number): Date {
  const now = new Date();
  const currentDay = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (currentDay <= statementDate) {
    month -= 1;
  }
  
  return new Date(year, month, statementDate + 1, 0, 0, 0, 0);
}

/**
 * 取得下一次的繳款截止日
 */
export function getNextDueDate(dueDate: number): Date {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  
  // 如果今天已經過了這個月的繳款日，就顯示下個月的繳款日
  if (now.getDate() > dueDate) {
    month += 1;
  }
  return new Date(year, month, dueDate);
}

/**
 * 產生並下載 iOS 行事曆 (.ics) 檔案，用於繳款提醒
 */
export function downloadICS(cardName: string, dueDate: number) {
  const nextDue = getNextDueDate(dueDate);
  
  const year = nextDue.getFullYear();
  const month = String(nextDue.getMonth() + 1).padStart(2, '0');
  const day = String(nextDue.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CardManager PWA//TW',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dateString}`,
    `DTEND;VALUE=DATE:${dateString}`,
    `SUMMARY:💳 信用卡繳款：${cardName}`,
    `DESCRIPTION:提醒您繳交 ${cardName} 的信用卡帳單！請開啟卡片管家確認本期金額。`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D', // 提前 1 天提醒
    'ACTION:DISPLAY',
    'DESCRIPTION:繳款提醒',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n'); // 使用 CRLF 確保 iOS 完美解析

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${cardName}_繳款提醒.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
