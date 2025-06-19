from flask import Flask
from flask_cors import CORS

import subprocess
import sys

app = Flask(__name__, static_folder="dist")
CORS(app)

node = None;

class NewNode:
    def __init__(self):
        self.mess = "NODE MESS"
    
    def get(self):
        return self.mess
    
@app.route("/")
def serve_index():
    return send_from_directory('dist', 'index.html')
    
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('dist', path)
    
      

@app.route("/run-script")
def run_script():
    global node
    if node is None:
        node = NewNode()
        return "NEW_NODE"
    else:
        return node.mess

@app.route("/launch-sim")
def launch_script():
    # Must be run in a ROS environment, because this will start a 
    result = subprocess.run(["gz", "sim"], capture_output=True, text=True)
    return result.stdout or "Done"

@app.route("/restart")
def restart():

    import os
    os._exit(8)
    #os.execv(sys.executable, ['python'] + sys.argv) 

host = sys.argv[1] if len(sys.argv) > 1 else "localhost"

app.run(host=host, port=5000)
