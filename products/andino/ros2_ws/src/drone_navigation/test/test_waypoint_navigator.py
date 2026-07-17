import pytest
from unittest.mock import Mock, patch
from drone_navigation.waypoint_navigator import WaypointNavigator


@pytest.fixture
def navigator():
    with patch('rclpy.init'), patch('rclpy.spin'), patch('rclpy.shutdown'):
        nav = WaypointNavigator()
        nav.current_position.x = 0.0
        nav.current_position.y = 0.0
        nav.current_position.z = 0.0
        return nav


def test_waypoint_received(navigator):
    """Al recibir un waypoint, el target se actualiza."""
    from geometry_msgs.msg import Point
    wp = Point(x=1.0, y=2.0, z=3.0)
    navigator.waypoint_callback(wp)
    assert navigator.target_position == wp


def test_control_loop_no_waypoint(navigator):
    """Sin waypoint, el control loop no publica nada."""
    with patch.object(navigator.cmd_pub, 'publish') as mock_pub:
        navigator.control_loop()
        mock_pub.assert_not_called()


def test_control_loop_moves_toward_target(navigator):
    """Con waypoint, publica cmd_vel en la dirección correcta."""
    from geometry_msgs.msg import Point
    navigator.waypoint_callback(Point(x=1.0, y=0.0, z=0.0))

    with patch.object(navigator.cmd_pub, 'publish') as mock_pub:
        navigator.control_loop()
        cmd = mock_pub.call_args[0][0]
        assert cmd.linear.x > 0  # debe moverse en X positivo
