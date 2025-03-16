import axios from 'axios';
import { Greeting, NewGreeting } from '../types';
import config from '../config';

const env = (process.env.NODE_ENV || 'development') as 'development' | 'production';
const API_URL = config[env].apiUrl;

export const getGreetings = async (): Promise<Greeting[]> => {
  const response = await axios.get(`${API_URL}/greetings`);
  return response.data;
};

export const createGreeting = async (newGreeting: NewGreeting): Promise<Greeting> => {
  const response = await axios.post(`${API_URL}/greetings`, newGreeting);
  return response.data;
}; 


