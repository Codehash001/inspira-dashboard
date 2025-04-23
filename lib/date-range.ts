type DateRangeType = 'day' | 'week' | 'month' | 'year'

export function getDateRange(range: DateRangeType) {
  const now = new Date()
  let startDate = new Date()
  const endDate = now

  switch (range) {
    case 'day':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'year':
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  return { startDate, endDate }
}
