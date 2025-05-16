import { 
  User, 
  InsertUser, 
  AiRequest, 
  InsertAiRequest, 
  AiResponse, 
  InsertAiResponse 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // AI Request operations
  getAIRequest(id: number): Promise<AiRequest | undefined>;
  getAIRequestsByUserId(userId: number): Promise<AiRequest[]>;
  createAIRequest(request: InsertAiRequest): Promise<AiRequest>;
  
  // AI Response operations
  getAIResponse(id: number): Promise<AiResponse | undefined>;
  getAIResponseByRequestId(requestId: number): Promise<AiResponse | undefined>;
  createAIResponse(response: InsertAiResponse): Promise<AiResponse>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private aiRequests: Map<number, AiRequest>;
  private aiResponses: Map<number, AiResponse>;
  private currentUserId: number;
  private currentRequestId: number;
  private currentResponseId: number;

  constructor() {
    this.users = new Map();
    this.aiRequests = new Map();
    this.aiResponses = new Map();
    this.currentUserId = 1;
    this.currentRequestId = 1;
    this.currentResponseId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // AI Request operations
  async getAIRequest(id: number): Promise<AiRequest | undefined> {
    return this.aiRequests.get(id);
  }
  
  async getAIRequestsByUserId(userId: number): Promise<AiRequest[]> {
    return Array.from(this.aiRequests.values()).filter(
      (request) => request.userId === userId
    );
  }
  
  async createAIRequest(insertRequest: InsertAiRequest): Promise<AiRequest> {
    const id = this.currentRequestId++;
    const request: AiRequest = { 
      ...insertRequest, 
      id, 
      createdAt: new Date() 
    };
    this.aiRequests.set(id, request);
    return request;
  }
  
  // AI Response operations
  async getAIResponse(id: number): Promise<AiResponse | undefined> {
    return this.aiResponses.get(id);
  }
  
  async getAIResponseByRequestId(requestId: number): Promise<AiResponse | undefined> {
    return Array.from(this.aiResponses.values()).find(
      (response) => response.requestId === requestId
    );
  }
  
  async createAIResponse(insertResponse: InsertAiResponse): Promise<AiResponse> {
    const id = this.currentResponseId++;
    const response: AiResponse = { 
      ...insertResponse, 
      id, 
      createdAt: new Date() 
    };
    this.aiResponses.set(id, response);
    return response;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
