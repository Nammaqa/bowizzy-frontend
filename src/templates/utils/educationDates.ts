const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatEducationMonthYear = (value?: string) => {
  if (!value) return '';

  const rawValue = String(value).trim();
  const yearMonthMatch = rawValue.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (yearMonthMatch) {
    const month = MONTHS[Number(yearMonthMatch[2]) - 1];
    return month ? `${month}-${yearMonthMatch[1]}` : yearMonthMatch[1];
  }

  const monthYearMatch = rawValue.match(/^(\d{2})\/(\d{4})$/);
  if (monthYearMatch) {
    const month = MONTHS[Number(monthYearMatch[1]) - 1];
    return month ? `${month}-${monthYearMatch[2]}` : monthYearMatch[2];
  }

  const namedMonthMatch = rawValue.match(/^([A-Za-z]{3,})\s+(\d{4})$/);
  if (namedMonthMatch) {
    const monthIndex = MONTHS.findIndex(month => month.toLowerCase() === namedMonthMatch[1].slice(0, 3).toLowerCase());
    const month = monthIndex >= 0 ? MONTHS[monthIndex] : namedMonthMatch[1].slice(0, 3);
    return `${month}-${namedMonthMatch[2]}`;
  }

  const yearMatch = rawValue.match(/(\d{4})/);
  return yearMatch ? yearMatch[1] : rawValue;
};

export const formatEducationDateRange = (education: any) => {
  const start = formatEducationMonthYear(education?.startYear || education?.startDate || '');
  const end = formatEducationMonthYear(education?.endYear || education?.yearOfPassing || education?.endDate || '');
  if(start === end) return start;
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
};
