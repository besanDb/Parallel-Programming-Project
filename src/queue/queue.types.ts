export interface InventoryBatchJob {
  chunk: {
    id: number;
    stock: number;
  }[];
}
