import axios from 'axios';
import { Greeting, NewGreeting } from '../types';

//const API_URL = 'http://localhost:3001/api';
const API_URL = 'https://greeting-backend-5b7aa5-dev.apps.silver.devops.gov.bc.ca/api';

export const getGreetings = async (): Promise<Greeting[]> => {
  const response = await axios.get(`${API_URL}/greetings`);
  return response.data;
};

export const createGreeting = async (newGreeting: NewGreeting): Promise<Greeting> => {
  const response = await axios.post(`${API_URL}/greetings`, newGreeting);
  return response.data;
}; 


