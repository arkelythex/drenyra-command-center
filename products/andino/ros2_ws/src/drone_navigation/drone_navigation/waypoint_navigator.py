import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist, Point
from nav_msgs.msg import Odometry
import math


class WaypointNavigator(Node):
    """Nodo de navegación: recibe waypoints y publica cmd_vel."""

    def __init__(self):
        super().__init__('waypoint_navigator')
        self.cmd_pub = self.create_publisher(Twist, '/drone/cmd_vel', 10)
        self.odom_sub = self.create_subscription(
            Odometry, '/drone/state', self.odom_callback, 10
        )
        self.waypoint_sub = self.create_subscription(
            Point, '/drone/waypoint', self.waypoint_callback, 10
        )

        self.current_position = Point()
        self.target_position = None
        self.timer = self.create_timer(0.1, self.control_loop)

        self.get_logger().info('WaypointNavigator iniciado')

    def odom_callback(self, msg: Odometry):
        self.current_position = msg.pose.pose.position

    def waypoint_callback(self, msg: Point):
        self.target_position = msg
        self.get_logger().info(f'Nuevo waypoint: ({msg.x:.2f}, {msg.y:.2f}, {msg.z:.2f})')

    def control_loop(self):
        if self.target_position is None:
            return

        dx = self.target_position.x - self.current_position.x
        dy = self.target_position.y - self.current_position.y
        dz = self.target_position.z - self.current_position.z
        distance = math.sqrt(dx**2 + dy**2)

        # P — control proporcional básico
        cmd = Twist()
        cmd.linear.x = min(dx * 0.5, 1.0)
        cmd.linear.y = min(dy * 0.5, 1.0)
        cmd.linear.z = min(dz * 0.5, 1.0)

        # Si está cerca del objetivo, frenar
        if distance < 0.2 and abs(dz) < 0.1:
            cmd.linear.x = 0.0
            cmd.linear.y = 0.0
            cmd.linear.z = 0.0
            self.target_position = None
            self.get_logger().info('Waypoint alcanzado')

        self.cmd_pub.publish(cmd)


def main(args=None):
    rclpy.init(args=args)
    node = WaypointNavigator()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
