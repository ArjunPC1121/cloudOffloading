# Blueprint to expose matrix multiplication as an HTTP endpoint
from flask import Blueprint, request, jsonify
import numpy as np

matrix_bp = Blueprint("matrix", __name__)


@matrix_bp.route("/matrix-multiply", methods=["POST"])
def matrix_multiply_route():
    data = request.get_json(silent=True) or {}
    a = data.get("matrixA")
    b = data.get("matrixB")

    if a is None or b is None:
        return jsonify({"error": "Both matrixA and matrixB are required"}), 400

    try:
        result = multiply_matrices(a, b)
        return jsonify({"result": result.tolist()})  # Convert numpy array back to list
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Matrix multiplication failed: {str(e)}"}), 500


def multiply_matrices(a, b):
    # Input validation
    if not isinstance(a, list) or not isinstance(b, list):
        raise ValueError("Matrices must be provided as lists")

    # if not a or not b:
    #     raise ValueError("Matrices cannot be empty")

    # if not all(isinstance(row, list) for row in a) or not all(
    #     isinstance(row, list) for row in b
    # ):
    #     raise ValueError("All matrix rows must be lists")

    # # Check if matrices are rectangular
    # if not all(len(row) == len(a[0]) for row in a):
    #     raise ValueError("Matrix A must be rectangular (all rows same length)")

    # if not all(len(row) == len(b[0]) for row in b):
    #     raise ValueError("Matrix B must be rectangular (all rows same length)")

    # # Check for empty rows
    # if len(a[0]) == 0 or len(b[0]) == 0:
    #     raise ValueError("Matrix rows cannot be empty")

    # # Validate numeric data
    # try:
    #     for i, row in enumerate(a):
    #         for j, val in enumerate(row):
    #             if not isinstance(val, (int, float)):
    #                 raise ValueError(
    #                     f"Matrix A contains non-numeric value at position [{i}][{j}]: {val}"
    #                 )

    #     for i, row in enumerate(b):
    #         for j, val in enumerate(row):
    #             if not isinstance(val, (int, float)):
    #                 raise ValueError(
    #                     f"Matrix B contains non-numeric value at position [{i}][{j}]: {val}"
    #                 )
    # except (TypeError, IndexError) as e:
    #     raise ValueError(f"Invalid matrix structure: {str(e)}")

    # Convert to numpy arrays for fast multiplication
    try:
        np_a = np.array(a, dtype=np.float64)
        np_b = np.array(b, dtype=np.float64)
    except Exception as e:
        raise ValueError(f"Failed to convert matrices to numpy arrays: {str(e)}")

    # Check dimensions for matrix multiplication
    if np_a.shape[1] != np_b.shape[0]:
        raise ValueError(
            f"Cannot multiply matrices: Matrix A has {np_a.shape[1]} columns but "
            f"Matrix B has {np_b.shape[0]} rows. For matrix multiplication A×B, "
            f"the number of columns in A must equal the number of rows in B."
        )

    # Perform fast matrix multiplication using NumPy
    try:
        result = np.dot(np_a, np_b)
        return result
    except Exception as e:
        raise ValueError(f"Matrix multiplication failed: {str(e)}")
