import random

import numpy as np

from brainrender import Scene
from brainrender.actors import Points

def get_n_random_points_in_region(region, N):
    """
    Gets N random points inside (or on the surface) of a mesh
    """

    region_bounds = region.mesh.bounds()
    X = np.random.randint(region_bounds[0], region_bounds[1], size=10000)
    Y = np.random.randint(region_bounds[2], region_bounds[3], size=10000)
    Z = np.random.randint(region_bounds[4], region_bounds[5], size=10000)
    pts = [[x, y, z] for x, y, z in zip(X, Y, Z)]

    ipts = region.mesh.inside_points(pts).coordinates
    return np.vstack(random.choices(ipts, k=N))


# Display the Allen Brain mouse atlas.
scene = Scene(atlas_name="allen_mouse_25um", title="Cells in primary visual cortex")

# Display a brain region
primary_visual = scene.add_brain_region("VISp", alpha=0.2)

# Get a numpy array with (fake) coordinates of some labelled cells
coordinates = get_n_random_points_in_region(primary_visual, 2000)

# Create a Points actor
cells = Points(coordinates)

# Add to scene
scene.add(cells)

# Add label to the brain region
scene.add_label(primary_visual, "Primary visual cortex")

# Display the figure.
# scene.render()

scene.export("cells_in_primary_visual_cortex.html")
