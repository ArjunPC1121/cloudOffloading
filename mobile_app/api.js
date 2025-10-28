import axios from 'axios';
import { API_BASE_URL } from './config';

export const sendMatrixForComputation = async (matrixA, matrixB) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/task/matrix-multiply`, { matrixA, matrixB });
        console.log('API Response:', response.data);
        return response.data.result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
