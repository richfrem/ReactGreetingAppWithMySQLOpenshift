export interface Config {
  apiUrl: string;
  apiBasePath: string;
  apiTimeout: number;
  apiRetries: number;
}

export interface AppConfig {
  development: Config;
  production: Config;
}

const config: AppConfig = {
  development: {
    apiUrl: "https://greeting-backend-5b7aa5-dev.apps.silver.devops.gov.bc.ca:3001",
    apiBasePath: "/api",
    apiTimeout: 5000,
    apiRetries: 3
  },
  production: {
    apiUrl: "https://greeting-backend-5b7aa5-dev.apps.silver.devops.gov.bc.ca:3001",
    apiBasePath: "/api",
    apiTimeout: 10000,
    apiRetries: 3
  }
};

export default config; 