import Constants from 'expo-constants';

const { apiBaseUrl } = Constants.expoConfig.extra || {};

if (!apiBaseUrl) {
    throw new Error('❌ API_BASE_URL is missing in Expo config!');
}

export const API_BASE_URL = apiBaseUrl;