from brainrender import Scene
from leap.connection import Connection, Listener
from leap.events import TrackingEvent
import vedo
import numpy as np
import time

# Configure vedo for VTK interaction
vedo.settings.default_backend = 'vtk'
vedo.settings.use_parallel_projection = True
vedo.settings.immediate_rendering = False 

class LeapController(Listener):
    def __init__(self, scene):
        super().__init__()
        self.scene = scene
        self.base_azimuth = 45
        self.base_elevation = 30
        self.sensitivity = 0.5
        self.last_update = time.time()
        
        # Initialize camera parameters properly
        self.scene.camera = {
            'azimuth': self.base_azimuth,
            'elevation': self.base_elevation,
            'roll': 0,
            'view_distance': 50
        }

    def on_event(self, event):
        if isinstance(event, TrackingEvent) and event.hands:
            if time.time() - self.last_update > 0.016:  # ~60Hz update rate
                self.update_camera(event.hands[0].palm.position)
                self.last_update = time.time()

    def update_camera(self, position):
        """Convert Leap Motion coordinates to camera controls"""
        delta_x = position.x * self.sensitivity * 0.01
        delta_y = position.y * self.sensitivity * 0.01
        delta_z = position.z * self.sensitivity * 0.01

        # Update camera parameters with bounds checking
        self.scene.camera['azimuth'] = self.base_azimuth + np.clip(delta_x, -180, 180)
        self.scene.camera['elevation'] = self.base_elevation + np.clip(delta_y, -90, 90)
        self.scene.camera['roll'] = np.clip(delta_z, -180, 180)
        self.scene.camera['view_distance'] = 50 + np.clip(delta_z * 5, 10, 200)
        
        # Trigger render update through VTK interactor
        if hasattr(self.scene.plotter, 'interactor'):
            self.scene.plotter.interactor.Render()

# Initialize brain scene
scene = Scene(atlas_name="allen_mouse_25um", title="Leap Motion Controller")
scene.add_brain_region("STR", alpha=0.3)
scene.add_brain_region("Isocortex", color="skyblue")

# Configure VTK window settings
scene.plotter.renderer.GetRenderWindow().SetMultiSamples(8)  # Anti-aliasing
scene.plotter.renderer.GetRenderWindow().SetSwapControl(1)   # VSync

# Set up Leap Motion
leap_controller = LeapController(scene)
conn = Connection(listeners=[leap_controller])

with conn.open(auto_poll=True):
    scene.render(interactive=False)  # Disable default mouse controls
    
    # Get VTK interactor reference
    interactor = scene.plotter.interactor
    interactor.Initialize()
    
    # Configure window
    scene.plotter.renderWindow.SetWindowName("Leap Motion Brain Viewer")
    
    print("Use your hands to control the brain view!")
    print("Move horizontally to rotate, vertically to elevate, forward/back to zoom")

    # Main rendering loop (from VTK forum solution)
    scene.plotter.renderWindow.Start()
    while True:
        if not scene.plotter.renderWindow.IsActive():
            break
        interactor.ProcessEvents()  # Handle VTK events
        time.sleep(0.001)  # Reduce CPU load
