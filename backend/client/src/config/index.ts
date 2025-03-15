interface Config {
  apiUrl: string;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://greeting-backend:3001'
};

export default config; 