from setuptools import setup

package_name = 'drone_bringup'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/drone_bringup.launch.py']),
        ('share/' + package_name + '/launch', ['launch/simulation.launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='dreamcoder08',
    maintainer_email='tu@email.com',
    description='Launch files para AndinoDroneLab',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [],
    },
)
