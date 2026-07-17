from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument('use_sim_time', default_value='false'),

        # Descripción del dron (URDF)
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                os.path.join(get_package_share_directory('drone_description'),
                             'launch', 'description.launch.py')
            ]),
            launch_arguments={'use_sim_time': LaunchConfiguration('use_sim_time')}.items(),
        ),

        # Navegación
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                os.path.join(get_package_share_directory('drone_navigation'),
                             'launch', 'navigation.launch.py')
            ]),
        ),
    ])
