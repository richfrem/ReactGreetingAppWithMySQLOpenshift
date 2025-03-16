import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  assetsInclude: ['**/*.svg'],  // Explicitly include SVG files
  publicDir: 'public',  // Explicitly set public directory
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // Keep images in their original directory structure
          if (name.includes('images/')) {
            return name;
          }
          return 'assets/[name][extname]'
        }
      }
    }
  },
  define: {
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env.CONFIG': JSON.stringify(`
development:
  # API Configuration
  apiUrl: "https://greeting-backend-5b7aa5-dev.apps.silver.devops.gov.bc.ca/api"
  apiTimeout: 5000
  apiRetries: 3

  # Application Settings
  appName: "Greeting App"
  appVersion: "1.0.0"
  defaultLanguage: "en"
  supportedLanguages: ["en", "fr", "es"]

  # UI Configuration
  theme:
    primaryColor: "#003366"
    secondaryColor: "#FCBA19"
    fontFamily: "BCSans, Noto Sans, Verdana, Arial, sans-serif"
    spacing: "1rem"
  
  # Feature Flags
  features:
    enableMultiLanguage: true
    enableDarkMode: true
    enableNotifications: false

  # Security Settings
  security:
    sessionTimeout: 3600
    maxLoginAttempts: 3

production:
  # API Configuration
  apiUrl: "https://greeting-backend-5b7aa5-dev.apps.silver.devops.gov.bc.ca/api"
  apiTimeout: 10000
  apiRetries: 3

  # Application Settings
  appName: "Greeting App"
  appVersion: "1.0.0"
  defaultLanguage: "en"
  supportedLanguages: ["en", "fr", "es"]

  # UI Configuration
  theme:
    primaryColor: "#003366"
    secondaryColor: "#FCBA19"
    fontFamily: "BCSans, Noto Sans, Verdana, Arial, sans-serif"
    spacing: "1rem"
  
  # Feature Flags
  features:
    enableMultiLanguage: true
    enableDarkMode: true
    enableNotifications: true

  # Security Settings
  security:
    sessionTimeout: 1800
    maxLoginAttempts: 5
    `)
  }
}))
