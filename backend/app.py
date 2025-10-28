from flask import Flask, jsonify
from flask_cors import CORS

from tasks import task_bp


app = Flask(__name__)
app.register_blueprint(task_bp)
CORS(app)


@app.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "Flask server is running"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
