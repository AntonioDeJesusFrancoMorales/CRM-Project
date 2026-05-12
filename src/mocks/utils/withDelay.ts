// Simula latencia de red. Default: 200-400ms (configurable).

export function withDelay(min = 200, max = 400): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
