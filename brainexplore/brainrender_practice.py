from brainrender import Scene
from brainrender.actors import Points
import numpy as np


# Initialize scene with Allen Mouse Brain Atlas
scene = Scene(atlas_name="allen_mouse_25um", title="3D Brain Viewer")

tumor_coords = np.array([[200, 50, 150]])

tumors = Points(
    tumor_coords, 
    name="Tumors",
    colors="darkred", 
    radius=150,  # Adjust based on tumor size
    alpha=0.7
)
scene.add(tumors)

# Add brain regions (e.g., striatum and cortex)
scene.add_brain_region("STR", alpha=0.3)  # Striatum
scene.add_brain_region("Isocortex", color="skyblue") 

# Render interactive windowhac
scene.render()

# Set specific view parameters
scene.camera['azimuth'] = 45  # Horizontal rotation
scene.camera['elevation'] = 30  # Vertical angle
scene.camera['roll'] = 0  # Tilt adjustment
scene.render()

