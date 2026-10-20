/** "Morning" until noon, "Afternoon" until 5 pm, "Evening" after (and before 5 am). */
export const greeting = (hour: number) => (hour >= 5 && hour < 12 ? 'Morning' : hour >= 12 && hour < 17 ? 'Afternoon' : 'Evening');
