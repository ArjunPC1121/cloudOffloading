from flask import Blueprint, request, jsonify
import numpy as np
import cv2
import base64


grayscale_bp = Blueprint("grayscale", __name__)


@grayscale_bp.route("/grayscale", methods=["POST"])
def process_grayscale():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        img_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Could not decode image"}), 400

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        success, buffer = cv2.imencode(".jpg", gray)
        if not success:
            return jsonify({"error": "Failed to encode image"}), 500

        processed_base64 = base64.b64encode(buffer).decode("utf-8")

        return jsonify({"processed_image": processed_base64})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
