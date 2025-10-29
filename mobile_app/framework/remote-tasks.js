import axios from 'axios';
import { API_BASE_URL } from "../config";
import { TASKS } from './constants';

export const runGrayscaleOnServer = async (params) => {
    const { originalImage } = params
    const response = await fetch(originalImage.uri);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image', {
        uri: originalImage,
        type: blob.type,
        name: 'upload.jpg',
    });

    const res = await axios.post(`${API_BASE_URL}/task/${TASKS.GRAYSCALE}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    const outputImage = `data:image/jpeg;base64,${res.data.processed_image}`;
    return { imageUri: outputImage };
}

export const runMatrixOnServer = async (params) => {
    const { a, b } = params;
    const matrixA = a;
    const matrixB = b;
    try {
        const response = await axios.post(`${API_BASE_URL}/task/${TASKS.MATRIX_MULTIPLY}`, { matrixA, matrixB });
        console.log('API Response:', response.data);
        return response.data.result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
export const remoteTaskExecutor = {
    [TASKS.GRAYSCALE]: runGrayscaleOnServer,
    [TASKS.MATRIX_MULTIPLY]: runMatrixOnServer,
};