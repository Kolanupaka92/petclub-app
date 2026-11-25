// Author: Sai Kolanupaka
export const daysUntil = (s) => {
  try {
    return Math.ceil((new Date(s) - Date.now()) / 864e5);
  } catch {
    return 9999;
  }
};

/** Vaccination or appointment due within the next N days (includes today) */
export const isDueSoon = (dateStr, withinDays = 30) => {
  const d = daysUntil(dateStr);
  return d >= 0 && d <= withinDays;
};

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};
