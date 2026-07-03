import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yangatechnologies.aza',
  appName: 'Aza',
  webDir: 'public',
  server: {
    url: 'https://a-za.vercel.app',
    cleartext: false
  }
};

export default config;
