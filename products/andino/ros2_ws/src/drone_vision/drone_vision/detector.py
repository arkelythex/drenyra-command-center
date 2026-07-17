import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D
import cv2
from cv_bridge import CvBridge
import numpy as np


class ObjectDetector(Node):
    """Nodo de detección de objetos usando OpenCV."""

    def __init__(self):
        super().__init__('object_detector')
        self.bridge = CvBridge()

        self.image_sub = self.create_subscription(
            Image, '/drone/camera/image', self.image_callback, 10
        )
        self.detection_pub = self.create_publisher(
            Detection2DArray, '/drone/detections', 10
        )

        # Placeholder: cargar modelo YOLO después
        self.net = None
        self.get_logger().info('ObjectDetector iniciado (modo placeholder)')

    def image_callback(self, msg: Image):
        cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')

        # Placeholder: detección simple por color
        hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, (0, 0, 200), (180, 30, 255))  # blanco
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = Detection2DArray()
        detections.header = msg.header

        for cnt in contours:
            if cv2.contourArea(cnt) > 500:
                x, y, w, h = cv2.boundingRect(cnt)
                detection = Detection2D()
                detection.bbox.center.x = float(x + w / 2)
                detection.bbox.center.y = float(y + h / 2)
                detection.bbox.size_x = float(w)
                detection.bbox.size_y = float(h)
                detections.detections.append(detection)

        self.detection_pub.publish(detections)


def main(args=None):
    rclpy.init(args=args)
    node = ObjectDetector()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
