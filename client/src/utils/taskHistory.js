function formatHistoryDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "long"
  }).format(date);
}

export function groupTasksByDate(tasks) {
  const groups = new Map();

  tasks.forEach((task) => {
    if (!groups.has(task.date)) {
      groups.set(task.date, {
        date: task.date,
        label: formatHistoryDate(task.date),
        tasks: []
      });
    }

    groups.get(task.date).tasks.push(task);
  });

  return Array.from(groups.values());
}
