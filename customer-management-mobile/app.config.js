import 'dotenv/config';

export default {
  expo: {
    name: 'Gifts Track',
    slug: 'customer-management-mobile',
    scheme: 'gifttrack',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'live.myprojectdemo.gifttrack',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'live.myprojectdemo.gifttrack',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'https://gift-track.myprojectdemo.live',
      eas: {
        projectId: '220af540-2d7a-453d-a810-debc9e418181',
      },
    },
    plugins: ['expo-secure-store'],
    owner: 'jipinm',
  },
};
