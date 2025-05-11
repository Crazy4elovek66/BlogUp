from flask import Flask
app = Flask(__name__)  # ← Это ключевая строка!

@app.route('/')
def index():
    return render_template('index.html', app_name="BlogUp")