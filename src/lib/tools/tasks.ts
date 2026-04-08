import { lineworksFetch } from "../lineworks/client";

interface Task {
  taskId: string;
  title: string;
  status: string;
  dueDateTime?: string;
  categoryName?: string;
}

interface TaskListResponse {
  tasks: Task[];
}

export async function getMyTasks(
  userId: string,
  period: "today" | "this_week" | "all",
): Promise<string> {
  const res = await lineworksFetch(`/users/${userId}/tasks`);
  const data: TaskListResponse = await res.json();

  let tasks = data.tasks ?? [];

  if (period !== "all") {
    const now = new Date();
    const endDate = new Date();

    if (period === "today") {
      endDate.setHours(23, 59, 59, 999);
    } else {
      const dayOfWeek = now.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      endDate.setDate(now.getDate() + daysUntilSunday);
      endDate.setHours(23, 59, 59, 999);
    }

    tasks = tasks.filter((t) => {
      if (!t.dueDateTime) return period === "today";
      const due = new Date(t.dueDateTime);
      return due >= now && due <= endDate;
    });
  }

  if (tasks.length === 0) {
    return "該当するタスクはありません。";
  }

  return tasks
    .map((t) => {
      const due = t.dueDateTime
        ? `期限: ${new Date(t.dueDateTime).toLocaleDateString("ja-JP")}`
        : "期限なし";
      return `- ${t.title}（${due}、${t.status}）`;
    })
    .join("\n");
}

export async function createTask(
  userId: string,
  title: string,
  dueDate?: string,
): Promise<string> {
  const body: Record<string, string> = { title };
  if (dueDate) {
    body.dueDateTime = `${dueDate}T23:59:59+09:00`;
  }

  await lineworksFetch(`/users/${userId}/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return `タスク「${title}」を作成しました。`;
}

export async function completeTask(
  userId: string,
  taskName: string,
): Promise<string> {
  const res = await lineworksFetch(`/users/${userId}/tasks`);
  const data: TaskListResponse = await res.json();

  const target = (data.tasks ?? []).find((t) => t.title.includes(taskName));

  if (!target) {
    const candidates = (data.tasks ?? [])
      .slice(0, 5)
      .map((t) => t.title)
      .join("、");
    return `「${taskName}」に一致するタスクが見つかりません。現在のタスク: ${candidates || "なし"}`;
  }

  await lineworksFetch(`/users/${userId}/tasks/${target.taskId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "completed" }),
  });

  return `タスク「${target.title}」を完了にしました。`;
}
