// Simple in-memory vector database for similarity search
export class MemVectorDB {
  private items: Map<string, { text: string; vector: number[] }>;
  private nextId: number;
  
  constructor() {
    this.items = new Map();
    this.nextId = 1;
  }
  
  /**
   * Add an item to the vector database
   */
  async addItem(text: string, vector: number[]): Promise<string> {
    const id = `item_${this.nextId++}`;
    this.items.set(id, { text, vector });
    return id;
  }
  
  /**
   * Get an item by ID
   */
  async getItem(id: string): Promise<{ text: string; vector: number[] } | null> {
    const item = this.items.get(id);
    return item || null;
  }
  
  /**
   * Delete an item by ID
   */
  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same dimensions");
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Search for similar items using cosine similarity
   */
  async searchSimilar(queryVector: number[], limit: number = 5): Promise<{ id: string; text: string; similarity: number }[]> {
    const results: { id: string; text: string; similarity: number }[] = [];
    
    for (const [id, item] of this.items.entries()) {
      try {
        const similarity = this.cosineSimilarity(queryVector, item.vector);
        results.push({ id, text: item.text, similarity });
      } catch (error) {
        console.error(`Error calculating similarity for item ${id}:`, error);
      }
    }
    
    // Sort by similarity (highest first) and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
  
  /**
   * Get the total number of items in the database
   */
  async count(): Promise<number> {
    return this.items.size;
  }
  
  /**
   * Clear all items from the database
   */
  async clear(): Promise<void> {
    this.items.clear();
  }
}
