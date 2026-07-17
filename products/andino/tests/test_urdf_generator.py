"""Tests for the URDF generator module."""
import pytest
import xml.etree.ElementTree as ET
from pathlib import Path

from morphology.design import DroneDesign
from morphology.urdf import URDFGenerator

# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture
def generator() -> URDFGenerator:
    return URDFGenerator()


@pytest.fixture
def quad_design() -> DroneDesign:
    return DroneDesign(frame_type="quad", arm_length=250.0, propeller_diameter=10.0)


def write_and_parse(gen: URDFGenerator, design: DroneDesign) -> ET.Element:
    path = gen.generate(design)
    tree = ET.parse(path)
    return tree.getroot()


def collect_links(root: ET.Element) -> set[str]:
    return {link.get("name") for link in root.findall(".//link")}


def collect_joints(root: ET.Element) -> dict[str, str]:
    """Return {joint_name: joint_type}."""
    return {j.get("name"): j.get("type", "fixed") for j in root.findall(".//joint")}


# ── URDF structure ────────────────────────────────────────────────────────────


class TestURDFStructure:
    def test_valid_xml(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Generated URDF must be well-formed XML."""
        root = write_and_parse(generator, quad_design)
        assert root.tag == "robot"

    def test_robot_name(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        assert root.get("name") == "andino_quad"

    def test_base_link_exists(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        links = collect_links(root)
        assert "base_link" in links

    def test_sensor_links_exist(self, generator: URDFGenerator, quad_design: DroneDesign):
        """All expected sensor links should be present."""
        root = write_and_parse(generator, quad_design)
        links = collect_links(root)
        for expected in ("pixhawk_link", "imu_link", "gps_link", "gps_mast_link", "battery_link"):
            assert expected in links, f"Missing link: {expected}"


class TestPropellers:
    """Verify propeller counts match frame type expectations."""

    @pytest.mark.parametrize("frame_type,expected_props,expected_arms", [
        ("quad", 4, 4),
        ("y6", 6, 3),   # coaxial: 3 arms × 2 props
        ("x8", 8, 4),   # coaxial: 4 arms × 2 props
        ("hexa", 6, 6),
        ("octo", 8, 8),
    ])
    def test_propeller_count(
        self, generator: URDFGenerator, frame_type: str, expected_props: int, expected_arms: int
    ):
        design = DroneDesign(frame_type=frame_type, arm_length=250.0, propeller_diameter=10.0)
        root = write_and_parse(generator, design)
        continuous = root.findall('.//joint[@type="continuous"]')
        assert len(continuous) == expected_props, (
            f"{frame_type}: expected {expected_props} continuous joints, got {len(continuous)}"
        )

    def test_propeller_joint_axes(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Each propeller joint must rotate around Z (lifting axis)."""
        root = write_and_parse(generator, quad_design)
        for joint in root.findall('.//joint[@type="continuous"]'):
            axis = joint.find("axis")
            assert axis is not None, f"Missing axis on {joint.get('name')}"
            assert axis.get("xyz") == "0 0 1"


class TestJointHierarchy:
    """Verify kinematics chain: base_link → arm → motor → propeller."""

    def test_arm_parent_is_base_link(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Arm joints connect base_link to arm links."""
        root = write_and_parse(generator, quad_design)
        # The hierarchy: base_link → arm_joint → arm → motor_joint → motor → prop_joint → prop
        # Arm joints are like "arm_fr_joint", "arm_fl_joint", etc.
        arm_joints = [
            j for j in root.findall(".//joint")
            if j.get("name", "").endswith("_joint")
            and not j.get("name", "").endswith("_motor_joint")
            and not j.get("name", "").endswith("_prop_joint")
            and j.get("name") != "joint_pixhawk"
            and j.get("name") != "joint_imu"
            and j.get("name") != "joint_gps_mast"
            and j.get("name") != "joint_gps"
            and j.get("name") != "joint_battery"
        ]
        assert len(arm_joints) == 4, f"Expected 4 arm joints, got {len(arm_joints)}: {[j.get('name') for j in arm_joints]}"
        for joint in arm_joints:
            parent = joint.find("parent")
            assert parent is not None
            assert parent.get("link") == "base_link"

    def test_motor_parent_is_arm(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Motor joints must have arm links as parent."""
        root = write_and_parse(generator, quad_design)
        motor_joints = [
            j for j in root.findall(".//joint")
            if j.get("name", "").endswith("_motor_joint")
        ]
        assert len(motor_joints) == 4, f"Expected 4 motor joints, got {len(motor_joints)}"
        for joint in motor_joints:
            parent = joint.find("parent")
            assert parent is not None
            parent_name = parent.get("link", "")
            assert parent_name.startswith("arm_"), f"Motor parent should be arm, got {parent_name}"

    def test_prop_parent_is_motor(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Each prop joint (continuous) must have a motor link as parent."""
        root = write_and_parse(generator, quad_design)
        for joint in root.findall('.//joint[@type="continuous"]'):
            parent = joint.find("parent")
            assert parent is not None
            parent_name = parent.get("link", "")
            assert parent_name.endswith("_motor") or parent_name.endswith("_motor_top") or parent_name.endswith("_motor_bottom"), (
                f"Prop parent should be motor, got {parent_name}"
            )


class TestTransmissions:
    """Every continuous joint must have a transmission."""

    def test_every_prop_has_transmission(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        # Transmissions reference joints via <joint name="..."> element
        trans_refs = set()
        for trans in root.findall(".//transmission"):
            for joint_el in trans.findall(".//joint"):
                ref = joint_el.get("name")
                if ref:
                    trans_refs.add(ref)
        prop_joint_names = {
            j.get("name") for j in root.findall('.//joint[@type="continuous"]')
        }
        missing = prop_joint_names - trans_refs
        assert not missing, f"Props without transmission: {missing}"

    def test_transmission_has_actuator(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        for trans in root.findall(".//transmission"):
            actuators = trans.findall(".//actuator")
            assert len(actuators) >= 1

    def test_transmission_count_matches_props(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        n_trans = len(root.findall(".//transmission"))
        n_props = len(root.findall('.//joint[@type="continuous"]'))
        assert n_trans == n_props, f"{n_trans} transmissions vs {n_props} props"


class TestGazeboIntegration:
    """Gazebo plugins are needed for SITL simulation."""

    def test_multicopter_motor_plugins(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        plugins = root.findall(".//plugin")
        motor_plugins = [
            p for p in plugins
            if "multicopter_motor_model" in p.get("filename", "")
        ]
        assert len(motor_plugins) == 4, f"Expected 4 motor plugins, got {len(motor_plugins)}"

    def test_motor_plugin_has_joint_and_turning(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Each motor plugin must have jointName and turningDirection."""
        root = write_and_parse(generator, quad_design)
        for plugin in root.findall(".//plugin"):
            if "multicopter_motor_model" in plugin.get("filename", ""):
                assert plugin.find("jointName") is not None
                assert plugin.find("turningDirection") is not None
                assert plugin.find("motorNumber") is not None

    def test_imu_gazebo_plugin(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        plugins = root.findall(".//plugin")
        imu = [p for p in plugins if "imu" in p.get("name", "").lower()]
        assert len(imu) >= 1

    def test_gps_gazebo_plugin(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        plugins = root.findall(".//plugin")
        gps = [p for p in plugins if "gps" in p.get("name", "").lower()]
        assert len(gps) >= 1


class TestCoaxialLayout:
    """Coaxial frames (Y6, X8) must have stacked propellers on each arm."""

    @pytest.mark.parametrize("frame_type,arms", [
        ("y6", 3),
        ("x8", 4),
    ])
    def test_coaxial_arm_structure(self, generator: URDFGenerator, frame_type: str, arms: int):
        design = DroneDesign(frame_type=frame_type, arm_length=250.0, propeller_diameter=10.0)
        root = write_and_parse(generator, design)
        # Each coaxial arm has: arm_link, top_prop_joint, bottom_prop_joint
        top_joints = [j for j in root.findall('.//joint[@type="continuous"]')
                      if j.get("name", "").endswith("_top_joint")]
        bottom_joints = [j for j in root.findall('.//joint[@type="continuous"]')
                         if j.get("name", "").endswith("_bottom_joint")]
        assert len(top_joints) == arms, f"Expected {arms} top joints, got {len(top_joints)}"
        assert len(bottom_joints) == arms, f"Expected {arms} bottom joints, got {len(bottom_joints)}"

    def test_coaxial_motor_names(self, generator: URDFGenerator):
        """Coaxial motors should be named consistently."""
        design = DroneDesign(frame_type="x8", arm_length=250.0)
        root = write_and_parse(generator, design)
        links = collect_links(root)
        motor_links = {l for l in links if "motor" in l}
        # For x8: 4 arms × 2 motors = 8 motor links
        assert len(motor_links) >= 8

        # Check naming pattern: arm_XX_motor_top and arm_XX_motor_bottom
        top = {l for l in motor_links if l.endswith("_top")}
        bottom = {l for l in motor_links if l.endswith("_bottom")}
        assert len(top) == 4
        assert len(bottom) == 4


class TestMaterials:
    """Materials must be defined at robot level and referenced by links."""

    def test_material_definitions(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        material_elements = root.findall(".//material")
        material_names = {m.get("name") for m in material_elements}
        for expected in ["carbon", "carbon_silver", "red", "blue", "orange", "white"]:
            assert expected in material_names, f"Missing material: {expected}"

    def test_visual_material_references(self, generator: URDFGenerator, quad_design: DroneDesign):
        """Visual elements should reference materials by name."""
        root = write_and_parse(generator, quad_design)
        material_refs = {v.find("material").get("name") for v in root.findall(".//visual")
                         if v.find("material") is not None}
        assert len(material_refs) >= 2


class TestInertiaValues:
    """Inertia matrices should be positive-definite (non-zero diagonal)."""

    def test_base_link_inertia(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        inertial = root.find('.//link[@name="base_link"]//inertial')
        assert inertial is not None
        inertia = inertial.find("inertia")
        assert inertia is not None
        ixx = float(inertia.get("ixx", 0))
        iyy = float(inertia.get("iyy", 0))
        izz = float(inertia.get("izz", 0))
        assert ixx > 0 and iyy > 0 and izz > 0, "Inertia diagonal must be positive"

    def test_arm_inertia_positive(self, generator: URDFGenerator, quad_design: DroneDesign):
        root = write_and_parse(generator, quad_design)
        for link in root.findall(".//link"):
            name = link.get("name", "")
            if name.startswith("arm_") and not name.endswith("_prop") and not name.endswith("_motor"):
                inertial = link.find("inertial")
                if inertial is not None:
                    inertia = inertial.find("inertia")
                    if inertia is not None:
                        for axis in ("ixx", "iyy", "izz"):
                            assert float(inertia.get(axis, 0)) > 0, f"{name} inertia {axis}=0"


class TestNonCoaxialInput:
    """quad, hexa, octo must NOT have coaxial stacking."""

    @pytest.mark.parametrize("frame_type", ["quad", "hexa", "octo"])
    def test_no_coaxial_joints(self, generator: URDFGenerator, frame_type: str):
        design = DroneDesign(frame_type=frame_type, arm_length=250.0, propeller_diameter=10.0)
        root = write_and_parse(generator, design)
        coaxial_joints = [
            j for j in root.findall('.//joint')
            if "_top_joint" in j.get("name", "") or "_bottom_joint" in j.get("name", "")
        ]
        assert len(coaxial_joints) == 0, f"{frame_type} should not have coaxial joints"

    def test_no_transmission_for_nonexistent_joints(self, generator: URDFGenerator):
        """Non-coaxial frames shouldn't reference top/bottom transmission names."""
        design = DroneDesign(frame_type="quad", arm_length=250.0)
        root = write_and_parse(generator, design)
        for trans in root.findall(".//transmission"):
            for joint_el in trans.findall(".//joint"):
                name = joint_el.get("name", "")
                assert "_top_" not in name and "_bottom_" not in name


class TestOutputToCustomPath:
    def test_custom_output_path(self, generator: URDFGenerator, quad_design: DroneDesign, tmp_path: Path):
        custom = tmp_path / "custom_test.urdf"
        path = generator.generate(quad_design, str(custom))
        assert Path(path).exists()
        assert Path(path).read_text().startswith("<?xml")

    def test_generate_all_configs(self, generator: URDFGenerator, quad_design: DroneDesign, tmp_path: Path):
        out = tmp_path / "all"
        paths = generator.generate_all_configs(quad_design, str(out))
        frame_types = {Path(p).stem.replace("andino_", "") for p in paths}
        expected = {"quad", "y6", "x8", "hexa", "octo"}
        assert frame_types == expected, f"Missing frame types: {expected - frame_types}"

    def test_output_dir_created(self, generator: URDFGenerator, quad_design: DroneDesign, tmp_path: Path):
        nested = tmp_path / "deep" / "nested"
        generator.generate(quad_design, str(nested / "test.urdf"))
        assert (nested / "test.urdf").exists()


class TestDesignToURDFMapping:
    """Verify design parameters flow correctly into URDF values."""

    def test_arm_length_maps_to_translation(self, generator: URDFGenerator):
        """arm_length=200mm should produce arm tip at ~0.141m from center."""
        design = DroneDesign(frame_type="quad", arm_length=200.0)
        root = write_and_parse(generator, design)
        # Find the first arm joint
        for joint in root.findall(".//joint"):
            name = joint.get("name", "")
            if name.endswith("_joint") and not name.endswith("_motor_joint") and not name.endswith("_prop_joint"):
                if name in ("joint_pixhawk", "joint_imu", "joint_gps_mast", "joint_gps", "joint_battery"):
                    continue
                origin = joint.find("origin")
                if origin is not None:
                    xyz = origin.get("xyz", "")
                    x, y, _ = [float(v) for v in xyz.split()]
                    # With arm_length=200mm=0.2m, arm at 45° means x=y=0.141m
                    assert abs(x) > 0.1, f"Expected significant arm translation, got xyz={xyz}"
                    break

    def test_propeller_diameter_maps_to_cylinder_radius(self, generator: URDFGenerator):
        """propeller_diameter=10in should create prop cylinders with radius=0.127m."""
        design = DroneDesign(frame_type="quad", propeller_diameter=10.0)
        root = write_and_parse(generator, design)
        # Find propeller cylinders (prop links are named arm_XX_prop)
        prop_cylinders = []
        for visual in root.findall(".//visual"):
            parent_link = visual.getparent() if hasattr(visual, 'getparent') else None
            # Find by walking up or checking for prop pattern
            geom = visual.find("geometry")
            if geom is not None and geom.find("cylinder") is not None:
                cyl = geom.find("cylinder")
                prop_cylinders.append(float(cyl.get("radius")))

        # The largest cylinder radius should be the prop (0.127m for 10in)
        prop_radius = max(prop_cylinders)
        expected = 10.0 * 0.0254 / 2  # inch to m → 0.127
        assert abs(prop_radius - expected) < 0.001, (
            f"Largest cylinder radius {prop_radius:.4f} doesn't match expected {expected:.4f}"
        )


class TestDifferentDesigns:
    """URDF should differ for different design parameters."""

    def test_differs_by_frame_type(self, generator: URDFGenerator):
        """Different frame types produce different URDFs."""
        quad = DroneDesign(frame_type="quad", arm_length=250.0)
        octo = DroneDesign(frame_type="octo", arm_length=250.0)
        root_quad = write_and_parse(generator, quad)
        root_octo = write_and_parse(generator, octo)
        quad_props = len(root_quad.findall('.//joint[@type="continuous"]'))
        octo_props = len(root_octo.findall('.//joint[@type="continuous"]'))
        assert quad_props != octo_props

    def test_includes_all_supported_frame_types(self, generator: URDFGenerator):
        """All 5 frame types should generate valid URDFs."""
        for ft in ("quad", "y6", "x8", "hexa", "octo"):
            design = DroneDesign(frame_type=ft, arm_length=250.0)  # type: ignore
            root = write_and_parse(generator, design)
            props = root.findall('.//joint[@type="continuous"]')
            assert len(props) > 0, f"{ft}: no continuous joints"
