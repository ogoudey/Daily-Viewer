from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

import tempfile
import subprocess
import sys
import os

app = Flask(__name__, static_folder="../dist")
CORS(app)

node = None;

class NewNode:
    def __init__(self):
        self.mess = "NODE MESS"
    
    def get(self):
        return self.mess

@app.route("/run-script")
def run_script():
    global node
    if node is None:
        node = NewNode()
        return "NEW_NODE"
    else:
        return node.mess

@app.route("/launch-sim", methods=["POST"])
def launch_script():
    data = request.get_json()
    sdf_content = data.get("sdf")

    if not sdf_content:
        return "Missing SDF content", 400
        
    # Must be run in a ROS environment, because this will start a 
    
    # Write to a temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".sdf", delete=False) as temp_file:
        temp_file.write(sdf_content)
        temp_file_path = temp_file.name

    try:
        # Run gz sim
        result = subprocess.run(["gz", "sim", temp_file_path], capture_output=True, text=True)
        output = result.stdout or result.stderr

        return jsonify({"output": output})
    finally:
        os.remove(temp_file_path)  # Clean up temp file
    
    # Launch ROS nodes capturing joint state/pose.
    return result.stdout or "Done"

@app.route("/restart")
def restart():

    import os
    os._exit(8)
    #os.execv(sys.executable, ['python'] + sys.argv) 

@app.route("/")
def serve_index():
    return send_from_directory('../dist', 'index.html')
    
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../dist', path)
    
###########
#  ROS 2  #
###########

# come up with some logic and interface for robots - running, sim running, training, etc.
"""
@app.route('/<robot_name>')
def serve_static(path):
    return send_from_directory('../dist', path)
"""

#### End ROS 2 stuff

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://flaskuser:flaskpass@localhost/dev'
db = SQLAlchemy(app)

# Models
class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    worlds = db.relationship('World', backref='profile')

class World(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    arenas = db.relationship('Arena', backref='world')

class Arena(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    world_id = db.Column(db.Integer, db.ForeignKey('world.id'))
    time_data = db.relationship('TimeData', backref='arena')

class TimeData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    arena_id = db.Column(db.Integer, db.ForeignKey('arena.id'))
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data = db.Column(db.JSON)

# Done once:
with app.app_context():
    db.create_all()

# Sample route
@app.route("/profiles/<int:profile_id>/worlds", methods=["GET"])
def get_worlds(profile_id):
    worlds = World.query.filter_by(profile_id=profile_id).all()
    return jsonify([{"id": w.id, "name": w.name} for w in worlds])
    
# Re-up data from database
@app.route("/arenas/<int:arena_id>/data", methods=["GET"])
def get_data(arena_id):
    entries = TimeData.query.filter_by(arena_id=arena_id).order_by(TimeData.timestamp).all()
    return jsonify([
        {"timestamp": entry.timestamp.isoformat(), "data": entry.data}
        for entry in entries
    ])
  
@app.route("/arenas/by_name/<string:arena_name>", methods=["GET"])
def get_arena_by_name(arena_name):
    arena = Arena.query.filter_by(name=arena_name).first()
    if not arena:
        return jsonify({"error": "Arena not found"}), 404
    return jsonify({"arena_id": arena.id})

dev_data_25csq = {
        "inventory": {
            "items": [
                {
                    "name": "Cup",
                    "geometry": "Cup",
                    "spawn": "spawn_point_cup",
                    "count": 10,
                    "case": {   
                        "name": "Cup_Sleeve",
                        "parts-per": 12,
                        "geometry": "Cup_Sleeve",
                        "spawn": "spawn_point_cup_sleeve",
                        "count": 7,
                        "case": {
                            "name": "Cup_Case",
                            "parts-per": 40,
                            "geometry": "Cup_Case",
                            "spawn": "spawn_point_cup_case",
                            "count": 2
                        }
                    }
                },
                {
                    "name": "Coffee",
                    "geometry": "Coffee",
                    "spawn": "spawn_point_coffee",
                    "count": 10
                },
                {
                    "name": "Maine Black Bear",
                    "geometry": "Ice_Cream_Tub",
                    "spawn": "spawn_point_ice_cream_tub",
                    "count": 5
                },
                {
                    "name": "Cotton Candy",
                    "geometry": "Ice_Cream_Tub",
                    "spawn": "spawn_point_ice_cream_tub",
                    "count": 3
                }
            ]
        }
    }

def log_dev_data_by_name(arena_name):
    arena = Arena.query.filter_by(name=arena_name).first()
    if not arena:
        raise ValueError("Arena not found")

    log_dev_data(arena_id=arena.id, dev_data=dev_data_25csq)

def log_dev_data(arena_id, dev_data=None):
    

    entry = TimeData(
        arena_id=arena_id,
        timestamp=datetime.utcnow(),
        data=dev_data
    )

    db.session.add(entry)
    db.session.commit()
    print(f"Data logged for arena {arena_id}, entry ID: {entry.id}")

# More Database utilities:
def get_or_create_arena(profile_name, world_name, arena_name):
    # Step 1: Get or create Profile
    profile = Profile.query.filter_by(name=profile_name).first()
    if not profile:
        profile = Profile(name=profile_name)
        db.session.add(profile)
        db.session.commit()
        print(f"Created Profile: {profile.name} (id={profile.id})")

    # Step 2: Get or create World under Profile
    world = World.query.filter_by(name=world_name, profile_id=profile.id).first()
    if not world:
        world = World(name=world_name, profile_id=profile.id)
        db.session.add(world)
        db.session.commit()
        print(f"Created World: {world.name} (id={world.id})")

    # Step 3: Get or create Arena under World
    arena = Arena.query.filter_by(name=arena_name, world_id=world.id).first()
    if not arena:
        arena = Arena(name=arena_name, world_id=world.id)
        db.session.add(arena)
        db.session.commit()
        print(f"Created Arena: {arena.name} (id={arena.id})")

    return arena.id

# End Database stuff

with app.app_context():
    try:
        arena_id = get_or_create_arena("developer", "world1", "25_central_square")
        log_dev_data(arena_id, dev_data_25csq) # inserts a timestamp of the current data, the JSON passed front-back
    except Exception:
        print("No database up or context not created.")
        sys.exit(1)

host = sys.argv[1] if len(sys.argv) > 1 else "localhost"
print("Running on", host)
app.run(host=host, port=5000)
