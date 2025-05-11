@app.route('/')
def index():
    return render_template('index.html', app_name="BlogUp")