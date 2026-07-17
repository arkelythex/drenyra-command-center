from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Callable, Optional

from .cerebellum import Cerebellum, Telemetry, FlightState, FlightResult, Position

logger = logging.getLogger(__name__)


class ROS2MessageType(Enum):
    STRING = auto()
    FLOAT32 = auto()
    FLOAT64 = auto()
    INT32 = auto()
    BOOL = auto()
    POSE = auto()
    TWIST = auto()
    BATTERY_STATE = auto()


@dataclass
class ROS2Topic:
    name: str
    msg_type: ROS2MessageType
    namespace: str = ""
    qos_reliability: str = "reliable"
    qos_durability: str = "volatile"

    @property
    def full_name(self) -> str:
        if self.namespace:
            return f"/{self.namespace}/{self.name.lstrip('/')}"
        return f"/{self.name.lstrip('/')}"


ROS2_MESSAGE_CALLBACK = Callable[[str, Any], None]


class ROSChain:
    """ROS 2 Bridge for AndinoDroneLab.

    Maps MAVSDK commands and telemetry to ROS 2 topics for inter-process
    communication. Supports configurable namespaces for multi-drone setups.

    This is a template interface — rclpy is imported lazily to avoid
    requiring ROS 2 at import time.
    """

    DEFAULT_TOPICS: dict[str, ROS2Topic] = {
        # Cerebellum commands (subscriptions)
        "arm": ROS2Topic("cerebellum/arm", ROS2MessageType.BOOL),
        "takeoff": ROS2Topic("cerebellum/takeoff", ROS2MessageType.FLOAT64),
        "land": ROS2Topic("cerebellum/land", ROS2MessageType.BOOL),
        "goto": ROS2Topic("cerebellum/goto", ROS2MessageType.POSE),
        "rtl": ROS2Topic("cerebellum/rtl", ROS2MessageType.BOOL),
        "emergency_stop": ROS2Topic("cerebellum/emergency_stop", ROS2MessageType.BOOL),
        # Telemetry publishers
        "telemetry": ROS2Topic("state/telemetry", ROS2MessageType.POSE),
        "battery": ROS2Topic("state/battery", ROS2MessageType.BATTERY_STATE),
        "flight_state": ROS2Topic("state/flight_state", ROS2MessageType.STRING),
        "heartbeat": ROS2Topic("state/heartbeat", ROS2MessageType.FLOAT64),
        # Mission commands
        "mission_start": ROS2Topic("mission/start", ROS2MessageType.STRING),
        "mission_status": ROS2Topic("mission/status", ROS2MessageType.STRING),
        # Emergency
        "emergency": ROS2Topic("emergency/alert", ROS2MessageType.STRING),
    }

    POSITION_TOPIC: str = "state/position_xyz"  # NED local frame

    def __init__(
        self,
        namespace: str = "",
        node_name: str = "andino_agent",
        use_sim_time: bool = False,
        cerebellum: Optional[Cerebellum] = None,
    ):
        self._namespace = namespace.strip("/")
        self._node_name = node_name
        self._use_sim_time = use_sim_time
        self._node = None
        self._publishers: dict[str, Any] = {}
        self._subscriptions: dict[str, Any] = {}
        self._message_callbacks: dict[str, list[ROS2_MESSAGE_CALLBACK]] = {}
        self._enabled = False
        self._cb = cerebellum

        self._topics = {
            key: ROS2Topic(
                name=topic.name,
                msg_type=topic.msg_type,
                namespace=self._namespace,
                qos_reliability=topic.qos_reliability,
                qos_durability=topic.qos_durability,
            )
            for key, topic in self.DEFAULT_TOPICS.items()
        }

        logger.info(
            "ROSChain initialized: namespace='%s' node='%s'",
            self._namespace, self._node_name,
        )

    # ── Lifecycle ────────────────────────────────────────────────────────

    def start(self) -> bool:
        """Initialize ROS 2 node and create publishers/subscriptions."""
        try:
            import rclpy
            from std_msgs.msg import Bool, Float64, String
            from geometry_msgs.msg import Pose, Twist
            from sensor_msgs.msg import BatteryState

            rclpy.init(args=None)
            self._node = rclpy.create_node(self._node_name)

            if self._use_sim_time:
                self._node.set_parameters([rclpy.parameter.Parameter("use_sim_time", rclpy.Parameter.Type.BOOL, True)])

            self._msg_map = {
                ROS2MessageType.BOOL: Bool,
                ROS2MessageType.FLOAT64: Float64,
                ROS2MessageType.STRING: String,
                ROS2MessageType.POSE: Pose,
                ROS2MessageType.TWIST: Twist,
                ROS2MessageType.BATTERY_STATE: BatteryState,
            }

            # Create publishers for telemetry topics
            for key in ("telemetry", "battery", "flight_state", "heartbeat", "mission_status", "emergency"):
                topic = self._topics.get(key)
                if topic:
                    msg_type = self._msg_map.get(topic.msg_type, String)
                    self._publishers[key] = self._node.create_publisher(
                        msg_type, topic.full_name, 10,
                    )

            # Create subscriptions for command topics
            for key in ("arm", "takeoff", "land", "goto", "rtl", "emergency_stop", "mission_start"):
                topic = self._topics.get(key)
                if topic:
                    msg_type = self._msg_map.get(topic.msg_type, String)
                    self._subscriptions[key] = self._node.create_subscription(
                        msg_type, topic.full_name,
                        lambda msg, k=key: self._on_ros_message(k, msg),
                        10,
                    )

            self._enabled = True
            logger.info("ROSChain started with %d publishers, %d subscriptions",
                         len(self._publishers), len(self._subscriptions))

            if self._cb:
                self._cb.on_telemetry(self._publish_telemetry)
                self._cb.on_state_change(self._publish_state_change)

            return True

        except ImportError:
            logger.warning("rclpy not installed, ROSChain running in bridge-only mode (no ROS 2)")
            self._enabled = False
            return False

    def spin_once(self, timeout_s: float = 0.1) -> None:
        if self._node and self._enabled:
            import rclpy
            rclpy.spin_once(self._node, timeout_sec=timeout_s)

    def stop(self) -> None:
        if self._node:
            import rclpy
            self._node.destroy_node()
            try:
                rclpy.shutdown()
            except RuntimeError:
                pass
        self._enabled = False
        logger.info("ROSChain stopped")

    @property
    def is_running(self) -> bool:
        return self._enabled

    # ── Message callbacks ────────────────────────────────────────────────

    def on_message(self, topic_key: str, callback: ROS2_MESSAGE_CALLBACK) -> None:
        if topic_key not in self._message_callbacks:
            self._message_callbacks[topic_key] = []
        self._message_callbacks[topic_key].append(callback)

    def _on_ros_message(self, topic_key: str, msg: Any) -> None:
        callbacks = self._message_callbacks.get(topic_key, [])
        payload = self._ros_msg_to_dict(msg)
        logger.debug("ROS message received on %s: %s", topic_key, payload)
        for cb in callbacks:
            try:
                cb(topic_key, payload)
            except Exception as exc:
                logger.error("ROS callback error on %s: %s", topic_key, exc)

    # ── Publish helpers ──────────────────────────────────────────────────

    def publish_command(self, topic_key: str, value: Any) -> None:
        if not self._enabled or topic_key not in self._publishers:
            return
        publisher = self._publishers[topic_key]
        msg = self._value_to_ros_msg(topic_key, value)
        if msg is not None:
            publisher.publish(msg)
            logger.debug("Published %s: %s", topic_key, value)

    def publish_telemetry(self, telemetry: Telemetry) -> None:
        self._publish_telemetry(telemetry)

    # ── Message translation (MAVSDK ↔ ROS 2) ─────────────────────────────

    def mavsdk_to_pose(self, telemetry: Telemetry) -> dict[str, Any]:
        return {
            "position": {
                "x": telemetry.position.lat,
                "y": telemetry.position.lon,
                "z": telemetry.altitude_amsl,
            },
            "orientation": {
                "heading": telemetry.heading_deg,
            },
            "linear_velocity": {
                "x": telemetry.ground_speed_ms,
                "y": 0.0,
                "z": 0.0,
            },
        }

    def pose_to_position(self, pose_msg: dict[str, Any]) -> Position:
        return Position(
            lat=pose_msg.get("position", {}).get("x", 0.0),
            lon=pose_msg.get("position", {}).get("y", 0.0),
            alt=pose_msg.get("position", {}).get("z", 0.0),
        )

    # ── Internal ─────────────────────────────────────────────────────────

    def _publish_telemetry(self, telemetry: Telemetry) -> None:
        if not self._enabled:
            return
        try:
            pose = self.mavsdk_to_pose(telemetry)
            self.publish_command("telemetry", pose)
            self.publish_command("battery", {
                "voltage": telemetry.battery_voltage,
                "percentage": telemetry.battery_percent,
            })
            self.publish_command("heartbeat", time.time())
        except Exception as exc:
            logger.error("Telemetry publish error: %s", exc)

    def _publish_state_change(self, state: FlightState) -> None:
        if self._enabled:
            self.publish_command("flight_state", state.name)

    def _ros_msg_to_dict(self, msg: Any) -> Any:
        try:
            if hasattr(msg, "x") and hasattr(msg, "y") and hasattr(msg, "z"):
                return {"x": msg.x, "y": msg.y, "z": msg.z}
            if hasattr(msg, "data"):
                return msg.data
            if hasattr(msg, "position"):
                p = msg.position
                return {
                    "position": {"x": p.x, "y": p.y, "z": p.z},
                    "orientation": {"x": msg.orientation.x, "y": msg.orientation.y,
                                    "z": msg.orientation.z, "w": msg.orientation.w},
                }
            return str(msg)
        except Exception:
            return str(msg)

    def _value_to_ros_msg(self, topic_key: str, value: Any) -> Any:
        topic = self._topics.get(topic_key)
        if topic is None:
            return None
        try:
            import rclpy
            from std_msgs.msg import Bool, Float64, String
            from geometry_msgs.msg import Pose, Twist
            from sensor_msgs.msg import BatteryState

            if topic.msg_type == ROS2MessageType.BOOL:
                msg = Bool()
                msg.data = bool(value)
                return msg
            elif topic.msg_type == ROS2MessageType.FLOAT64:
                msg = Float64()
                msg.data = float(value)
                return msg
            elif topic.msg_type == ROS2MessageType.STRING:
                msg = String()
                msg.data = str(value)
                return msg
            elif topic.msg_type == ROS2MessageType.POSE:
                msg = Pose()
                if isinstance(value, dict):
                    pos = value.get("position", {})
                    msg.position.x = float(pos.get("x", 0))
                    msg.position.y = float(pos.get("y", 0))
                    msg.position.z = float(pos.get("z", 0))
                return msg
            elif topic.msg_type == ROS2MessageType.BATTERY_STATE:
                msg = BatteryState()
                if isinstance(value, dict):
                    msg.voltage = float(value.get("voltage", 0))
                    msg.percentage = float(value.get("percentage", 0))
                return msg
            else:
                msg = String()
                msg.data = json.dumps(value)
                return msg
        except ImportError:
            return None
