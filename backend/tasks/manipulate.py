from flask import Blueprint, request, jsonify
import numpy as np
import cv2
import base64
import psutil
import cpuinfo
import time

try:
    SERVER_CPU_MODEL = cpuinfo.get_cpu_info()["brand_raw"]
except:
    SERVER_CPU_MODEL = "unknown"  # Fallback


manipulation_bp = Blueprint("manipulation", __name__)


@manipulation_bp.route("/manipulate", methods=["POST"])
@manipulation_bp.route("/flip-remote", methods=["POST"])
def process_complex_manipulation():
    """
    Replicates the logic of the local runManipulateLocally function (Rotate, Flip, Resize, Low-Compression Save).
    """
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        img_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Could not decode image"}), 400

        cpu_load = psutil.cpu_percent()
        mem_percent = psutil.virtual_memory().percent
        start_time = time.perf_counter_ns()  # Use high-precision timer
        core_count = psutil.cpu_count(logical=True)
        cpu_freq = psutil.cpu_freq()

        # 1. Rotate 90 degrees (ImageManipulator.rotate: 90)
        # CV2.ROTATE_90_CLOCKWISE is equivalent to a 90-degree clockwise rotation
        rotated = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)

        # 2. Flip Vertically (ImageManipulator.flip: Vertical)
        # cv2.flip(src, flipCode). flipCode=0 is a vertical flip.
        flipped = cv2.flip(rotated, 0)

        # 3. Resize to width 600 (ImageManipulator.resize: { width: 600 })
        # Calculate aspect ratio to determine new height
        original_height, original_width = flipped.shape[:2]
        new_width = 600
        aspect_ratio = new_width / original_width
        new_height = int(original_height * aspect_ratio)

        resized = cv2.resize(
            flipped, (new_width, new_height), interpolation=cv2.INTER_LINEAR
        )

        # 4. Low Compression (compress: 0.1, or quality: 99 in CV2/JPEG)
        # OpenCV uses a quality scale from 0 (worst) to 100 (best/lowest compression).
        # compress: 0.1 (high quality/low compression) is equivalent to a high quality setting.
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 99]

        success, buffer = cv2.imencode(".jpg", resized, encode_param)
        if not success:
            return jsonify({"error": "Failed to encode image"}), 500

        processed_base64 = base64.b64encode(buffer).decode("utf-8")
        end_time = time.perf_counter_ns()
        compute_time_ms = (end_time - start_time) / 1_000_000
        return jsonify(
            {
                "processed_image": processed_base64,
                "server_cpu_load": cpu_load,
                "server_memory_percent": mem_percent,
                "server_compute_time_ms": round(compute_time_ms, 5),
                "server_core_count": core_count,
                "server_cpu_model": SERVER_CPU_MODEL,
                "server_cpu_freq_current": round(cpu_freq.current, 5),
                "server_cpu_freq_max": round(cpu_freq.max, 5),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
