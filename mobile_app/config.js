import Constants from 'expo-constants';

const { apiBaseUrl, logUrl } = Constants.expoConfig.extra || {};

if (!apiBaseUrl) {
    throw new Error('❌ API_BASE_URL is missing in Expo config!');
}

if (!logUrl) {
    throw new Error('❌ LOG_URL is missing in Expo config!');
}

export const API_BASE_URL = apiBaseUrl;
export const LOG_URL = logUrl;