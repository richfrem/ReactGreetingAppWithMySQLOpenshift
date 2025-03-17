import axios from 'axios';
import { Greeting, NewGreeting, ApiType } from '../types';
import config from '../config';

const env = (process.env.NODE_ENV || 'development') as 'development' | 'production';

const getApiUrl = (apiType: ApiType): string => {
  const { nodejsApiUrl, dotnetApiUrl } = config[env];
  return apiType === ApiType.NODEJS ? nodejsApiUrl : dotnetApiUrl;
};

export const getGreetings = async (apiType: ApiType): Promise<Greeting[]> => {
  const API_URL = getApiUrl(apiType);
  const response = await axios.get(`${API_URL}/greetings`);
  return response.data;
};

export const createGreeting = async (newGreeting: NewGreeting, apiType: ApiType): Promise<Greeting> => {
  const API_URL = getApiUrl(apiType);
  const response = await axios.post(`${API_URL}/greetings`, newGreeting);
  return response.data;
}; 


