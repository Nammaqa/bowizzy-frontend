const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getMonthName = (month: string) => {
  const monthIndex = Number(month) - 1;
  return MONTH_NAMES[monthIndex] || month;
};

export const formatPortfolioDuration = (duration?: string) => {
  if (!duration) return "";

  return duration
    .replace(/\b(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?\b/g, (_match, year, month) => {
      return `${getMonthName(month)} ${year}`;
    })
    .replace(/\b(0[1-9]|1[0-2])\s*[-/]\s*(\d{4})\b/g, (_match, month, year) => {
      return `${getMonthName(month)} ${year}`;
    });
};
