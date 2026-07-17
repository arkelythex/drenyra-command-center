from launch import LaunchDescription
from launch.actions import (
    DeclareLaunchArgument,
    IncludeLaunchDescription,
    ExecuteProcess,
    LogInfo,
    RegisterEventHandler,
)
from launch.event_handlers import OnProcessExit
from launch.conditions import IfCondition
from launch.substitutions import (
    LaunchConfiguration,
    PathJoinSubstitution,
    Command,
    FindExecutable,
)
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
            'use_sim_time',
            default_value='true',
            description='Use simulation time',
        ),
        DeclareLaunchArgument(
            'world',
            default_value='empty',
            description='Gazebo world file name (without .world extension)',
        ),
        DeclareLaunchArgument(
            'namespace',
            default_value='drone',
            description='Namespace for all nodes',
        ),
        DeclareLaunchArgument(
            'spawn_x',
            default_value='0.0',
            description='X spawn position',
        ),
        DeclareLaunchArgument(
            'spawn_y',
            default_value='0.0',
            description='Y spawn position',
        ),
        DeclareLaunchArgument(
            'spawn_z',
            default_value='0.5',
            description='Z spawn position',
        ),
        DeclareLaunchArgument(
            'headless',
            default_value='false',
            description='Run Gazebo headless',
        ),
        DeclareLaunchArgument(
            'paused',
            default_value='false',
            description='Start Gazebo paused',
        ),
        DeclareLaunchArgument(
            'enable_px4_sitl',
            default_value='true',
            description='Enable PX4 SITL simulation',
        ),
    ]

    platform = LaunchConfiguration('platform')
    use_sim_time = LaunchConfiguration('use_sim_time')
    world = LaunchConfiguration('world')
    namespace = LaunchConfiguration('namespace')
    spawn_x = LaunchConfiguration('spawn_x')
    spawn_y = LaunchConfiguration('spawn_y')
    spawn_z = LaunchConfiguration('spawn_z')
    headless = LaunchConfiguration('headless')
    paused = LaunchConfiguration('paused')
    enable_px4_sitl = LaunchConfiguration('enable_px4_sitl')

    urdf_path = PathJoinSubstitution([
        get_package_share_directory('drone_description'),
        'urdf',
        ['andino_', platform, '.urdf'],
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

    gazebo_world = PathJoinSubstitution([
        get_package_share_directory('drone_bringup'),
        'worlds',
        [world, '.world'],
    ])

    gazebo = ExecuteProcess(
        condition=IfCondition(enable_px4_sitl),
        cmd=[
            FindExecutable(name='gazebo'),
            '--verbose',
            '-s', 'libgazebo_ros_factory.so',
            gazebo_world,
        ],
        output='screen',
        additional_env={'GAZEBO_MODEL_PATH': os.path.join(
            get_package_share_directory('drone_description'), 'urdf',
        )},
    )

    spawn_entity = Node(
        condition=IfCondition(enable_px4_sitl),
        package='gazebo_ros',
        executable='spawn_entity.py',
        name='spawn_drone',
        output='screen',
        arguments=[
            '-topic', 'robot_description',
            '-entity', ['andino_', platform],
            '-x', spawn_x,
            '-y', spawn_y,
            '-z', spawn_z,
            '-namespace', namespace,
        ],
    )

    mavros_sitl = Node(
        condition=IfCondition(enable_px4_sitl),
        package='mavros',
        executable='mavros_node',
        name='mavros',
        namespace=namespace,
        output='screen',
        parameters=[{
            'fcu_url': 'udp://:14540@127.0.0.1:14557',
            'gcs_url': 'udp://@127.0.0.1:14550',
            'target_system_id': 1,
            'target_component_id': 1,
            'fcu_protocol': 'v2.0',
            'use_sim_time': use_sim_time,
        }],
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

    log_info = LogInfo(
        msg=['Starting simulation for platform: ', platform],
    )

    return LaunchDescription([
        *declared_arguments,
        log_info,
        robot_state_publisher,
        gazebo,
        spawn_entity,
        mavros_sitl,
        navigation_launch,
        vision_launch,
        control_node,
        safety_node,
        telemetry_node,
    ])
