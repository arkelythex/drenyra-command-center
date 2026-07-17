from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package='drone_navigation',
            executable='waypoint_navigator',
            name='waypoint_navigator',
            output='screen',
        ),
    ])
