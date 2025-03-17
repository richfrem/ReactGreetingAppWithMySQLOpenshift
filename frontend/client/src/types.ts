export interface Greeting {
  id: number;
  name: string;
  greeting: string;
  created_at?: string;
  createdAt?: string;
}

export interface NewGreeting {
  name: string;
  greeting: string;
}

export enum ApiType {
  NODEJS = 'nodejs',
  DOTNET = 'dotnet'
} 