import axios from 'axios';

//Computer's local IP and Flask port:
const API_URL = 'http://192.168.1.199:5000';

export const sendMatrixForComputation = async (matrixA, matrixB) => {
  try {
    const response = await axios.post(`${API_URL}/task/matrix-multiply`, { matrixA, matrixB });
    console.log('API Response:', response.data);
    return response.data.result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
