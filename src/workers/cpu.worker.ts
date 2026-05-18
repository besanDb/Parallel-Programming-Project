import { parentPort } from 'worker_threads';

interface Task {
  type: 'CALCULATE_TOTAL';
  items?: { price: number; quantity: number }[];
}

parentPort?.on('message', (task: Task): void => {
  if (task.type === 'CALCULATE_TOTAL') {
    console.log(task.items);
    const total = (task.items || []).reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0,
    );

    parentPort?.postMessage(total);
  }
});
