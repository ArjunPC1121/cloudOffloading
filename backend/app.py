from flask import Flask, request, jsonify
from flask_cors import CORS
from computation import multiply_matrices

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
    
if __name__=='__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)