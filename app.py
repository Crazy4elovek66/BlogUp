from flask import Flask
from flask import Flask, render_template
app = Flask(__name__)  # ← Это ключевая строка!

@app.route('/')
def index():
    return render_template('index.html', app_name="BlogUp")