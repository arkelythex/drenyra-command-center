from setuptools import setup

package_name = 'drone_navigation'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/navigation.launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='dreamcoder08',
    maintainer_email='tu@email.com',
    description='Navegación autónoma con waypoints',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'waypoint_navigator = drone_navigation.waypoint_navigator:main',
        ],
    },
)
