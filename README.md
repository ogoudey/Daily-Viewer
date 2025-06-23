# Daily Viewer
This project is a proof of concept for service industry software.

![image](https://github.com/user-attachments/assets/105787f5-2b26-4b32-9aaa-2de2390ab328)

## Architecture
### Backend
On one computer run the server. The backend manages live data and starts subprocesses. After building the `/dist` folder, from `/backend` run:
```
./safe_start.sh 0.0.0.0
```
### Usage
Go to the IPadd ress of the host computer, port 5000.



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
