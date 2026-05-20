const QUEUE_KEY = 'leen_offline_queue';
const MAX_ITEMS = 50;
const MAX_RETRIES = 3;

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueCount() {
  return getQueue().length;
}

export function enqueueRequest(action, data) {
  const queue = getQueue();
  if (queue.length >= MAX_ITEMS) return null;

  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    data,
    idempotencyKey: data.idempotencyKey,
    queuedAt: new Date().toISOString(),
    retries: 0,
  };

  queue.push(item);
  saveQueue(queue);
  return item.id;
}

export function removeFromQueue(id) {
  saveQueue(getQueue().filter((item) => item.id !== id));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue(rawPostFn) {
  const queue = getQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await rawPostFn(item.action, item.data);
      removeFromQueue(item.id);
      synced++;
    } catch {
      const updated = getQueue().map((q) => {
        if (q.id !== item.id) return q;
        const newRetries = q.retries + 1;
        if (newRetries >= MAX_RETRIES) {
          console.error('[offlineQueue] Permanent failure — dropping item:', q);
          return null;
        }
        return { ...q, retries: newRetries };
      }).filter(Boolean);

      saveQueue(updated);
      failed++;
    }
  }

  return { synced, failed };
}
