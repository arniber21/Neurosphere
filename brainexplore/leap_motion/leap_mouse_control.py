#!/usr/bin/env python3
"""
Leap Motion Mouse Controller for macOS M1
This script uses Leap Motion to control your mouse cursor on macOS M1.
"""

import os
import sys
sys.path.insert(0, "/Applications/Ultraleap Hand Tracking.app/Contents/LeapSDK/lib")
import time
import math
import Cocoa
import Quartz
from AppKit import NSEvent

# Add the Leap Motion SDK Python library to the path
# You'll need to adjust this path to where you installed the Leap Motion SDK
leap_sdk_path = "/Applications/Ultraleap Hand Tracking.app/Contents/LeapSDK"
sys.path.append(leap_sdk_path)

try:
    import Leap
except ImportError:
    print("Error: Cannot import Leap Motion SDK. Please check your installation.")
    print("Download the SDK from https://developer.leapmotion.com/ and install it.")
    sys.exit(1)

class MouseListener(Leap.Listener):
    def __init__(self):
        super(MouseListener, self).__init__()
        self.screen_width = Cocoa.NSScreen.mainScreen().frame().size.width
        self.screen_height = Cocoa.NSScreen.mainScreen().frame().size.height
        
        # Configuration parameters - adjust these to your preference
        self.smoothing = 0.2  # Lower for more responsive, higher for smoother (between 0-1)
        self.interaction_box_size = 200  # Size of the interaction box in mm
        self.last_x = self.screen_width / 2
        self.last_y = self.screen_height / 2
        self.last_click_time = time.time()
        self.click_cooldown = 0.5  # Seconds between allowed clicks
        
    def on_init(self, controller):
        print("Initialized")
        
    def on_connect(self, controller):
        print("Connected to Leap Motion Controller")
        print("Move your hand above the controller to control the mouse")
        print("Make a tap gesture with your index finger to click")
        
    def on_disconnect(self, controller):
        print("Disconnected from Leap Motion Controller")
        
    def on_exit(self, controller):
        print("Exited")
        
    def on_frame(self, controller):
        # Get the most recent frame
        frame = controller.frame()
        
        if not frame.hands.is_empty:
            # Get the first hand
            hand = frame.hands[0]
            
            # Get fingers
            fingers = hand.fingers
            index_finger = fingers.finger_type(Leap.Finger.TYPE_INDEX)[0]
            
            if index_finger.is_valid:
                # Get stabilized position of the index finger's tip
                tip_position = index_finger.stabilized_tip_position
                
                # Map the finger position to screen coordinates
                x = self.map_position(tip_position.x, -self.interaction_box_size, self.interaction_box_size, 0, self.screen_width)
                # Invert y-axis (Leap's y grows upward, screen's y grows downward)
                y = self.map_position(tip_position.y, 0, self.interaction_box_size * 1.5, self.screen_height, 0)
                
                # Apply smoothing
                smooth_x = self.last_x + (x - self.last_x) * (1 - self.smoothing)
                smooth_y = self.last_y + (y - self.last_y) * (1 - self.smoothing)
                
                # Move the mouse cursor
                self.move_mouse(smooth_x, smooth_y)
                
                # Update the last position
                self.last_x = smooth_x
                self.last_y = smooth_y
                
                # Detect gestures for clicking
                if self.detect_tap_gesture(frame, index_finger):
                    self.click_mouse()
    
    def map_position(self, value, in_min, in_max, out_min, out_max):
        """Map a value from one range to another"""
        # Constrain the input value to the input range
        value = max(in_min, min(value, in_max))
        return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
    
    def move_mouse(self, x, y):
        """Move the mouse to the specified coordinates"""
        point = Quartz.CGPoint(x, y)
        event = Quartz.CGEventCreateMouseEvent(
            None, Quartz.kCGEventMouseMoved, point, Quartz.kCGMouseButtonLeft
        )
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
    
    def click_mouse(self):
        """Perform a left mouse click"""
        current_time = time.time()
        if current_time - self.last_click_time < self.click_cooldown:
            return
            
        # Get current mouse position
        mouse_pos = NSEvent.mouseLocation()
        point = Quartz.CGPoint(mouse_pos.x, Cocoa.NSScreen.mainScreen().frame().size.height - mouse_pos.y)
        
        # Left mouse down
        event = Quartz.CGEventCreateMouseEvent(
            None, Quartz.kCGEventLeftMouseDown, point, Quartz.kCGMouseButtonLeft
        )
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
        
        # Short delay
        time.sleep(0.05)
        
        # Left mouse up
        event = Quartz.CGEventCreateMouseEvent(
            None, Quartz.kCGEventLeftMouseUp, point, Quartz.kCGMouseButtonLeft
        )
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
        
        # Update last click time
        self.last_click_time = current_time
    
    def detect_tap_gesture(self, frame, index_finger):
        """Detect a tap gesture with the index finger"""
        # This is a simplified tap detection
        # You can improve this by using Leap's built-in gesture recognition
        
        # Check if the finger is moving downward quickly
        if index_finger.tip_velocity.y < -200:  # Threshold for downward velocity in mm/s
            return True
        
        return False


def main():
    # Create our listener and controller
    listener = MouseListener()
    controller = Leap.Controller()
    
    # Add the listener to the controller
    controller.add_listener(listener)
    
    print("Press Enter to quit...")
    try:
        sys.stdin.readline()
    except KeyboardInterrupt:
        pass
    finally:
        # Remove the listener when done
        controller.remove_listener(listener)


if __name__ == "__main__":
    main()