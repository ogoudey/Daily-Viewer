# Daily Viewer
Simulators tend to be opaque. That's why applications (e.g. Robosuite) were developed, but these applications are tailored to research, not development and usability.

This project hopes to alleviate this issue and ease the integration of robotics into the world. It creates realistic training environments from logistically correct digital twins of real world dynamic environments. In the process it enables:
- A manager for deployed robots in businesses.
- Interfaces for inventory management, ordering, and POS devices.

Use cases start with a preexisting real space in the world (an assembly line, cafe, warehouse, supermarket...), and the application generates ready-to-use policies for the user's desired outcomes.

![image](https://github.com/user-attachments/assets/c3fa409c-0bb0-4e2f-90e3-b0fb3cc6d1a6)

^^^ mock up of a preexisting cafe.

## Architecture
### Backend
On one computer run the server. The backend manages live data and starts subprocesses. After building the `/dist` folder, from `/backend` run:
```
./safe_start.sh 0.0.0.0
```
### Usage
Go to the IP address of the host computer, port 5000.

### Installation
```
pip install flask flask_cors flat_sqlalchemy
```

## Example (Hypothetical) Use Cases
### A Platform for Service Robots
1. A barista robot gets orders from the POS (point-of-sale) system to execute a `make-drink` policy (and decrements the store's inventory).
2. A cashier robot tracks a person entering the store.
3. A human gives natural language instruction to a VLA-driven robot.

It would be on Daily Viewer, a digital overlay to a particular environment, that human-robot and human-technology collaboration would be made possible.

## How it could work:

![image](https://github.com/user-attachments/assets/c3768ed3-b0b5-4f19-a570-a144795a3214)

Integrations:
* Links to ordering portals.
* Integration with POS provider.
* Integration with ROS for sensor hardware and robots' topics.
* Rampant Agentic AI integration for natural language understanding as it pertains to the 3D model, ordering, robotic control, and customer interaction.

Train:
    disorderer -> sim-poses -> reward=order
    
Test deployed:
    ... -> detector -> policy
    
Train:
    placer -> sim-poses -> reward=new_order (converting inventory / "promises" of order)




