package app

import (
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
)

type executeDoneMsg struct {
	resp   *harness.ExecuteResponse
	models map[string]string
	err    error
}

type doctorDoneMsg struct {
	checks []tui.DoctorCheck
	allOK  bool
	err    error
}
