import flask
from .grayscale import grayscale_bp
from .matrix import matrix_bp

task_bp = flask.Blueprint("task", __name__, url_prefix="/task")
task_bp.register_blueprint(grayscale_bp)
task_bp.register_blueprint(matrix_bp)
