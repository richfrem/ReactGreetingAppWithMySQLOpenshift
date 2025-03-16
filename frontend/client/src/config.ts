export interface Config {
  apiUrl: string;
  apiTimeout: number;
  apiRetries: number;
}

export interface AppConfig {
  development: Config;
  production: Config;
}

const config: AppConfig = {
  development: {
    apiUrl: "/api",
    apiTimeout: 5000,
    apiRetries: 3
  },
  production: {
    apiUrl: "/api",
    apiTimeout: 10000,
    apiRetries: 3
  }
};

export default config;