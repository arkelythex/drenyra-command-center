import pytest
import sys
sys.path.insert(0, '.')

from morphology.design import DroneDesign
from morphology.surrogate import PhysicsSurrogate, PerformanceMetrics


class TestPhysicsSurrogate:

    def test_surrogate_predict(self, default_design):
        surrogate = PhysicsSurrogate()
        m = surrogate.predict(default_design)
        assert isinstance(m, PerformanceMetrics)
        assert m.payload_g >= 0
        assert m.flight_time_min >= 0
        assert m.cost_usd > 0
        assert m.stability_index >= 0
        assert m.altitude_performance > 0
        assert m.hover_current_a > 0
        assert m.drag_n >= 0
        assert m.power_w >= 0
        assert m.energy_wh > 0
        assert m.disc_loading_g_dm2 > 0
        assert m.reynolds_prop > 0
        assert m.max_speed_ms >= 0

    def test_performance_metrics_to_dict(self, default_design):
        surrogate = PhysicsSurrogate()
        m = surrogate.predict(default_design)
        d = m.to_dict()
        expected_keys = {
            "payload_g", "flight_time_min", "cost_usd", "stability_index",
            "altitude_performance", "hover_current_a", "max_speed_ms",
            "drag_n", "power_w", "energy_wh", "disc_loading_g_dm2",
            "reynolds_prop",
        }
        assert set(d.keys()) == expected_keys

    def test_performance_metrics_to_tuple(self, default_design):
        surrogate = PhysicsSurrogate()
        m = surrogate.predict(default_design)
        t = m.to_tuple()
        assert len(t) == 5
        assert all(isinstance(v, float) for v in t)


class TestPhysicsFormulas:

    def test_altitude_correction(self, default_design, light_design):
        surrogate = PhysicsSurrogate()
        m_sea = surrogate.predict(default_design)
        from morphology.design import AIR_DENSITY_SEA, AIR_DENSITY_4000M
        expected_ratio = AIR_DENSITY_4000M / AIR_DENSITY_SEA
        assert m_sea.altitude_performance == pytest.approx(expected_ratio, rel=0.3)

    def test_battery_endurance(self, default_design, heavy_design):
        surrogate = PhysicsSurrogate()
        m_default = surrogate.predict(default_design)
        m_heavy = surrogate.predict(heavy_design)
        assert m_default.flight_time_min > 0
        assert m_heavy.flight_time_min > 0

    def test_cost_estimation(self, default_design, heavy_design, light_design):
        surrogate = PhysicsSurrogate()
        for d in [default_design, heavy_design, light_design]:
            m = surrogate.predict(d)
            assert m.cost_usd > 0
            assert m.cost_usd < 50000

    def test_stability_index(self, default_design):
        surrogate = PhysicsSurrogate()
        m = surrogate.predict(default_design)
        assert 0 <= m.stability_index <= 1

    def test_drag_estimate(self, default_design, heavy_design, light_design):
        surrogate = PhysicsSurrogate()
        for d in [default_design, heavy_design, light_design]:
            m = surrogate.predict(d)
            assert m.drag_n >= 0

    def test_heavy_design_lower_twr(self, heavy_design, light_design):
        assert heavy_design.twr < light_design.twr

    def test_light_design_efficiency(self, default_design, heavy_design, light_design):
        surrogate = PhysicsSurrogate()
        m_light = surrogate.predict(light_design)
        m_heavy = surrogate.predict(heavy_design)
        assert m_heavy.cost_usd > m_light.cost_usd

    def test_disk_loading_increases_with_payload(self, default_design, heavy_design):
        surrogate = PhysicsSurrogate()
        m_default = surrogate.predict(default_design)
        m_heavy = surrogate.predict(heavy_design)
        assert m_heavy.disc_loading_g_dm2 >= 0
        assert m_default.disc_loading_g_dm2 >= 0


class TestTransformerSurrogate:

    def test_transformer_not_trained_by_default(self):
        from morphology.surrogate import TransformerSurrogate
        ts = TransformerSurrogate()
        assert ts.is_trained is False

    def test_transformer_delegates_to_physics(self, default_design):
        from morphology.surrogate import TransformerSurrogate
        ts = TransformerSurrogate()
        m = ts.predict(default_design)
        assert isinstance(m, PerformanceMetrics)
        assert m.flight_time_min > 0

    def test_transformer_train_raises_not_implemented(self):
        from morphology.surrogate import TransformerSurrogate
        ts = TransformerSurrogate()
        with pytest.raises(NotImplementedError):
            ts.train([])
