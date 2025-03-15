import axios from 'axios';
import { Greeting, NewGreeting } from '../types';

const API_URL = 'http://greeting-backend:3001/api';

export const getGreetings = async (): Promise<Greeting[]> => {
  const response = await axios.get(`${API_URL}/greetings`);
  return response.data;
};

export const createGreeting = async (newGreeting: NewGreeting): Promise<Greeting> => {
  const response = await axios.post(`${API_URL}/greetings`, newGreeting);
  return response.data;
}; 