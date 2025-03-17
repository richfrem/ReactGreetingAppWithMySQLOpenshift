export interface Config {
  nodejsApiUrl: string;
  dotnetApiUrl: string;
  apiTimeout: number;
  apiRetries: number;
}

export interface AppConfig {
  development: Config;
  production: Config;
}

const config: AppConfig = {
  development: {
    nodejsApiUrl: "/api-nodejs",
    dotnetApiUrl: "/api-dotnet",
    apiTimeout: 5000,
    apiRetries: 3
  },
  production: {
    nodejsApiUrl: "/api-nodejs",
    dotnetApiUrl: "/api-dotnet",
    apiTimeout: 10000,
    apiRetries: 3
  }
};

export default config;