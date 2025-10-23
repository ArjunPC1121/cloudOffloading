from flask import Flask, request, jsonify
from flask_cors import CORS
from computation import multiply_matrices
import numpy as np
import cv2
import base64

app=Flask(__name__)
CORS(app)

@app.route('/status', methods=['GET'])
def status():
    return jsonify({'status':'Flask server is running'})

@app.route('/compute', methods=['POST'])
def compute():
    data = request.json
    matrix_a=data.get('matrixA')
    matrix_b=data.get('matrixB')
    
    if not matrix_a or not matrix_b:
        return jsonify({'error':'Invalid input matrices'}) , 400
    
    try:
        result = multiply_matrices(matrix_a,matrix_b)
        return jsonify({'result':result})
    except Exception as e:
        return jsonify({'error':str(e)}), 500
    
@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        img_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'error': 'Could not decode image'}), 400
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Encode back to JPEG
        success, buffer = cv2.imencode('.jpg', gray)
        if not success:
            return jsonify({'error': 'Failed to encode image'}), 500
        
        processed_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({'processed_image': processed_base64})
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

    
if __name__=='__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)