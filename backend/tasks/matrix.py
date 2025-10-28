# Blueprint to expose matrix multiplication as an HTTP endpoint
from flask import Blueprint, request, jsonify

matrix_bp = Blueprint("matrix", __name__)


@matrix_bp.route("/matrix-multiply", methods=["POST"])
def matrix_multiply_route():
    data = request.get_json(silent=True) or {}
    print(data)
    a = data.get("matrixA")
    b = data.get("matrixB")

    if a is None or b is None:
        return jsonify({"error": "Both matrixA and matrixB are required"}), 400

    try:
        result = multiply_matrices(a, b)
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def multiply_matrices(a, b):
    if len(a[0]) != len(b):
        raise ValueError(
            "Number of cols in matrix A must be equal to number of rows in matrix B"
        )

    result = [[0 for _ in range(len(b[0]))] for _ in range(len(a))]

    for i in range(len(a)):
        for j in range(len(b[0])):
            for k in range(len(b)):
                result[i][j] += a[i][k] * b[k][j]

    return result
