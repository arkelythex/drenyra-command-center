package tui

import (
	"math"
	"strconv"
	"strings"
)

// contrastRatio returns WCAG 2.x contrast ratio between two #RRGGBB colors.
func contrastRatio(fg, bg string) float64 {
	l1 := relativeLuminance(fg)
	l2 := relativeLuminance(bg)
	if l1 < l2 {
		l1, l2 = l2, l1
	}
	return (l1 + 0.05) / (l2 + 0.05)
}

func relativeLuminance(hex string) float64 {
	r, g, b := hexToRGB(hex)
	return 0.2126*linear(r) + 0.7152*linear(g) + 0.0722*linear(b)
}

func linear(c float64) float64 {
	if c <= 0.03928 {
		return c / 12.92
	}
	return math.Pow((c+0.055)/1.055, 2.4)
}

func hexToRGB(hex string) (float64, float64, float64) {
	h := strings.TrimPrefix(strings.ToLower(hex), "#")
	if len(h) != 6 {
		return 0, 0, 0
	}
	parse := func(s string) float64 {
		v, _ := strconv.ParseInt(s, 16, 64)
		return float64(v) / 255
	}
	return parse(h[0:2]), parse(h[2:4]), parse(h[4:6])
}
