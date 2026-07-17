from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, LogInfo
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution, Command
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node
from launch_ros.descriptions import ParameterValue
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    declared_arguments = [
        DeclareLaunchArgument(
            'platform',
            default_value='heavy_x8',
            description='Drone platform: heavy_x8 (810mm X8) or scout_y6 (650mm Y6)',
        ),
        DeclareLaunchArgument(
            'serial_port',
            default_value='/dev/ttyACM0',
            description='Pixhawk serial port',
        ),
        DeclareLaunchArgument(
            'serial_baud',
            default_value='921600',
            description='Pixhawk serial baud rate',
        ),
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Use simulation time',
        ),
        DeclareLaunchArgument(
            'gps_enabled',
            default_value='true',
            description='Enable GPS fusion',
        ),
        DeclareLaunchArgument(
            'lidar_enabled',
            default_value='true',
            description='Enable LiDAR for height estimation',
        ),
        DeclareLaunchArgument(
            'namespace',
            default_value='drone',
            description='Namespace for all nodes',
        ),
    ]

    platform = LaunchConfiguration('platform')
    serial_port = LaunchConfiguration('serial_port')
    serial_baud = LaunchConfiguration('serial_baud')
    use_sim_time = LaunchConfiguration('use_sim_time')
    gps_enabled = LaunchConfiguration('gps_enabled')
    lidar_enabled = LaunchConfiguration('lidar_enabled')
    namespace = LaunchConfiguration('namespace')

    urdf_path = PathJoinSubstitution([
        get_package_share_directory('drone_description'),
        'urdf',
        LaunchConfiguration('urdf_filename'),
    ])

    robot_description = ParameterValue(
        Command(['xacro ', urdf_path]),
        value_type=str,
    )

    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        namespace=namespace,
        output='screen',
        parameters=[{
            'robot_description': robot_description,
            'use_sim_time': use_sim_time,
            'frame_prefix': [namespace, '/'],
            'publish_frequency': 50.0,
        }],
    )

    mavros_node = Node(
        package='mavros',
        executable='mavros_node',
        name='mavros',
        namespace=namespace,
        output='screen',
        parameters=[{
            'fcu_url': ['serial://', serial_port, ':', serial_baud],
            'gcs_url': '',
            'target_system_id': 1,
            'target_component_id': 1,
            'fcu_protocol': 'v2.0',
            'use_sim_time': use_sim_time,
        }],
    )

    px4_params_node = Node(
        package='mavros',
        executable='param_publisher',
        name='px4_params',
        namespace=namespace,
        output='screen',
        parameters=[
            os.path.join(
                get_package_share_directory('drone_bringup'),
                'config', 'px4_params.yaml',
            ),
        ],
    )

    navigation_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            os.path.join(
                get_package_share_directory('drone_navigation'),
                'launch', 'navigation.launch.py',
            ),
        ]),
        launch_arguments={
            'namespace': namespace,
            'use_sim_time': use_sim_time,
            'platform': platform,
        }.items(),
    )

    vision_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            os.path.join(
                get_package_share_directory('drone_vision'),
                'launch', 'vision.launch.py',
            ),
        ]),
        launch_arguments={
            'namespace': namespace,
            'use_sim_time': use_sim_time,
        }.items(),
    )

    control_node = Node(
        package='drone_control',
        executable='controller_node',
        name='controller',
        namespace=namespace,
        output='screen',
        parameters=[{
            'use_sim_time': use_sim_time,
            'platform': platform,
        }],
    )

    safety_node = Node(
        package='drone_safety',
        executable='safety_monitor',
        name='safety_monitor',
        namespace=namespace,
        output='screen',
        parameters=[{
            'use_sim_time': use_sim_time,
            'gps_required': gps_enabled,
            'lidar_required': lidar_enabled,
        }],
    )

    telemetry_node = Node(
        package='drone_telemetry',
        executable='telemetry_node',
        name='telemetry',
        namespace=namespace,
        output='screen',
        parameters=[{
            'use_sim_time': use_sim_time,
        }],
    )

    log_platform = LogInfo(
        msg=('Launching AndinoDroneLab on platform: ', platform),
    )

    urdf_filename_arg = DeclareLaunchArgument(
        'urdf_filename',
        default_value=[
            'andino_', platform, '.urdf',
        ],
        description='URDF filename based on platform',
    )

    return LaunchDescription([
        *declared_arguments,
        urdf_filename_arg,
        log_platform,
        robot_state_publisher,
        mavros_node,
        px4_params_node,
        navigation_launch,
        vision_launch,
        control_node,
        safety_node,
        telemetry_node,
    ])
