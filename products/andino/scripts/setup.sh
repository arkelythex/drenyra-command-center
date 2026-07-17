#!/usr/bin/env bash
# =============================================================================
# setup.sh — AndinoDroneLab Full Development Environment Setup
# =============================================================================
# Automates the installation and configuration of the entire AndinoDroneLab
# development environment on Arch Linux.
#
# Usage:
#   ./scripts/setup.sh [OPTIONS]
#
# Options:
#   --help, -h         Show this help
#   --ros-distro NAME  ROS 2 distro (rolling|humble), default: rolling
#   --px4              Clone and build PX4-Autopilot
#   --gazebo           Install Gazebo simulation
#   --jetson           Setup NVIDIA Jetson toolchain (cross-compile)
#   --firmware         Build firmware targets
#   --all              Install everything
#   --ci               CI mode (non-interactive, minimal output)
# =============================================================================

set -euo pipefail

# ── Constants ─────────────────────────────────────────────────────────────────
SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
START_TIME="$(date +%s)"
LOG_FILE="${PROJECT_ROOT}/logs/setup-$(date +%Y%m%d-%H%M%S).log"
MIN_DISK_GB=20
MIN_RAM_MB=8192
REQUIRED_PACKAGES=(
  base-devel git python python-pip cmake ninja curl wget
)

# ── Colors ────────────────────────────────────────────────────────────────────
if [[ -t 1 ]] && [[ "${TERM:-}" != "dumb" ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  MAGENTA='\033[0;35m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  DIM='\033[2m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' MAGENTA='' CYAN='' BOLD='' DIM='' NC=''
fi

# ── Logging ───────────────────────────────────────────────────────────────────
mkdir -p "$(dirname "$LOG_FILE")"

log()   { local lvl=$1; shift; echo -e "$(date '+%H:%M:%S') [$lvl] $*" >> "$LOG_FILE"; }
info()  { echo -e "  ${GREEN}◆${NC} $*"; log "INFO" "$*"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $*"; log "WARN" "$*"; }
error() { echo -e "  ${RED}✖${NC} $*"; log "ERROR" "$*"; }
die()   { error "$*"; exit 1; }
header(){ echo -e "\n${BOLD}${BLUE}══ $* ══${NC}\n"; log "HEADER" "$*"; }
ok()    { echo -e "  ${GREEN}✔${NC} $*"; }

# ── Spinner for long operations ───────────────────────────────────────────────
spinner() {
  local pid=$1 delay=0.1 spin=('⣾' '⣽' '⣻' '⢿' '⡿' '⣟' '⣯' '⣷')
  while kill -0 "$pid" 2>/dev/null; do
    for c in "${spin[@]}"; do echo -ne "\r${CYAN}${c}${NC}"; sleep "$delay"; done
  done
  echo -ne "\r${GREEN}✔${NC} "
}

# ── Cleanup trap ──────────────────────────────────────────────────────────────
cleanup() {
  local exit_code=$?
  local elapsed=$(( $(date +%s) - START_TIME ))
  echo ""
  if [[ $exit_code -eq 0 ]]; then
    info "Setup completed successfully in ${elapsed}s"
  else
    error "Setup failed (exit $exit_code) after ${elapsed}s — check ${LOG_FILE}"
  fi
  exit "$exit_code"
}
trap cleanup EXIT

# ── Help ──────────────────────────────────────────────────────────────────────
show_help() {
  cat <<EOF
${BOLD}${CYAN}AndinoDroneLab — Development Environment Setup${NC}

${BOLD}Usage:${NC}  ${SCRIPT_NAME} [OPTIONS]

${BOLD}Options:${NC}
  --help, -h         Show this help
  --ros-distro NAME  ROS 2 distro (rolling|humble), default: rolling
  --px4              Clone and build PX4-Autopilot
  --gazebo           Install Gazebo simulation
  --jetson           Setup NVIDIA Jetson toolchain (cross-compile)
  --firmware         Build firmware targets
  --all              Install everything
  --ci               CI mode (non-interactive, minimal output)

${BOLD}Examples:${NC}
  ${SCRIPT_NAME}                              Minimal setup (core tools + ROS 2)
  ${SCRIPT_NAME} --ros-distro humble           Use ROS 2 Humble instead of Rolling
  ${SCRIPT_NAME} --px4 --gazebo                PX4 + Gazebo SITL environment
  ${SCRIPT_NAME} --all                         Full environment
  ${SCRIPT_NAME} --all --ros-distro humble     Full env with ROS 2 Humble
  ${SCRIPT_NAME} --ci                          Non-interactive CI mode
EOF
  exit 0
}

# ── Parse arguments ───────────────────────────────────────────────────────────
ROS_DISTRO="rolling"
INSTALL_PX4=false
INSTALL_GAZEBO=false
INSTALL_JETSON=false
INSTALL_FIRMWARE=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)          show_help ;;
    --ros-distro)       shift; ROS_DISTRO="$1" ;;
    --px4)              INSTALL_PX4=true ;;
    --gazebo)           INSTALL_GAZEBO=true ;;
    --jetson)           INSTALL_JETSON=true ;;
    --firmware)         INSTALL_FIRMWARE=true ;;
    --all)              INSTALL_PX4=true; INSTALL_GAZEBO=true; INSTALL_FIRMWARE=true ;;
    --ci)               CI_MODE=true ;;
    *)                  die "Unknown option: $1. Use --help for usage." ;;
  esac
  shift
done

# Validate ROS distro
case "$ROS_DISTRO" in
  rolling|humble) ;;
  *) die "Unsupported ROS distro: ${ROS_DISTRO}. Use rolling or humble." ;;
esac

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}     _          _ _           ____       _            _${NC}"
echo -e "${CYAN}${BOLD}    / \   _ __ (_) |_ _   _  |  _ \ _ __(_)_ __   ___| |${NC}"
echo -e "${CYAN}${BOLD}   / _ \ | '_ \| | __| | | | | | | | '__| | '_ \ / _ \ |${NC}"
echo -e "${CYAN}${BOLD}  / ___ \| | | | | |_| |_| | | |_| | |  | | | | |  __/ |${NC}"
echo -e "${CYAN}${BOLD} /_/   \_\_| |_|_|\__|\__, | |____/|_|  |_|_| |_|\___|_|${NC}"
echo -e "${CYAN}${BOLD}                      |___/${NC}"
echo -e "${DIM}  Development Environment Setup — Arch Linux${NC}"
echo -e "${DIM}  Log: ${LOG_FILE}${NC}"
echo ""

[[ "$CI_MODE" == true ]] && info "CI mode enabled (non-interactive)"

# ═════════════════════════════════════════════════════════════════════════════
# 1. SYSTEM REQUIREMENTS CHECK
# ═════════════════════════════════════════════════════════════════════════════

check_system() {
  header "System Requirements Check"

  # Arch Linux check
  if [[ ! -f /etc/arch-release ]]; then
    die "This script is designed for Arch Linux. Detected: $(cat /etc/os-release 2>/dev/null | grep -oP '(?<=^ID=).*' || echo 'unknown')"
  fi
  ok "Arch Linux detected"

  # Internet connectivity
  if ! ping -c 1 -W 3 archlinux.org &>/dev/null && ! ping -c 1 -W 3 google.com &>/dev/null; then
    die "No internet connectivity detected"
  fi
  ok "Internet connectivity verified"

  # Disk space
  local available_kb available_gb
  available_kb="$(df --output=avail "$PROJECT_ROOT" 2>/dev/null | tail -1)"
  available_gb="$(( available_kb / 1024 / 1024 ))"
  if [[ "$available_gb" -lt "$MIN_DISK_GB" ]]; then
    warn "Only ${available_gb}GB available (minimum ${MIN_DISK_GB}GB recommended)"
  else
    ok "Disk space: ${available_gb}GB available"
  fi

  # RAM
  local total_ram total_ram_mb
  total_ram="$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}')"
  total_ram_mb="$(( total_ram / 1024 ))"
  if [[ "$total_ram_mb" -lt "$MIN_RAM_MB" ]]; then
    warn "Only ${total_ram_mb}MB RAM (minimum ${MIN_RAM_MB}MB recommended)"
  else
    ok "Memory: ${total_ram_mb}MB RAM"
  fi

  # Check for AUR helper
  AUR_HELPER=""
  for helper in paru yay trizen pamac; do
    if command -v "$helper" &>/dev/null; then
      AUR_HELPER="$helper"
      break
    fi
  done

  if [[ -z "$AUR_HELPER" ]]; then
    die "No AUR helper found. Install one first:\n  git clone https://aur.archlinux.org/paru.git && cd paru && makepkg -si"
  fi
  ok "AUR helper: ${AUR_HELPER}"

  # Check sudo
  if ! sudo -n true 2>/dev/null; then
    if [[ "$CI_MODE" == true ]]; then
      die "Passwordless sudo required for CI mode"
    fi
    warn "Sudo may prompt for password during installation"
  else
    ok "Passwordless sudo available"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
# 2. PACKAGE INSTALLATION
# ═════════════════════════════════════════════════════════════════════════════

install_package_group() {
  local label=$1 desc=$2
  shift 2
  local packages=("$@")

  header "${label}"
  info "${desc}"

  local missing=()
  for pkg in "${packages[@]}"; do
    if pacman -Qi "$pkg" &>/dev/null; then
      ok "${pkg} already installed"
    else
      missing+=("$pkg")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    info "All packages already installed"
    return
  fi

  info "Installing ${#missing[@]} packages: ${missing[*]}"
  if [[ "$CI_MODE" == true ]]; then
    sudo pacman -S --noconfirm --needed "${missing[@]}" 2>&1 | tee -a "$LOG_FILE"
  else
    sudo pacman -S --needed "${missing[@]}" 2>&1 | tee -a "$LOG_FILE"
  fi
  ok "Package group installed: ${label}"
}

install_aur_package_group() {
  local label=$1 desc=$2
  shift 2
  local packages=("$@")

  header "${label}"
  info "${desc}"

  local missing=()
  for pkg in "${packages[@]}"; do
    if pacman -Qi "$pkg" &>/dev/null; then
      ok "${pkg} already installed"
    else
      missing+=("$pkg")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    info "All AUR packages already installed"
    return
  fi

  info "Installing ${#missing[@]} AUR packages: ${missing[*]}"
  if [[ "$CI_MODE" == true ]]; then
    $AUR_HELPER -S --noconfirm --needed "${missing[@]}" 2>&1 | tee -a "$LOG_FILE"
  else
    $AUR_HELPER -S --needed "${missing[@]}" 2>&1 | tee -a "$LOG_FILE"
  fi
  ok "AUR packages installed: ${label}"
}

install_core_packages() {
  header "Core Development Tools"
  info "Installing base-devel, git, python, cmake, and build essentials"

  if [[ "$CI_MODE" == true ]]; then
    sudo pacman -Syu --noconfirm 2>&1 | tee -a "$LOG_FILE"
  else
    info "Updating system packages (this may take a moment)..."
    sudo pacman -Syu 2>&1 | tee -a "$LOG_FILE"
  fi
  ok "System updated"

  local all_pkgs=("${REQUIRED_PACKAGES[@]}")

  # Add Python toolchain
  all_pkgs+=(
    python-pipx python-virtualenv python-setuptools python-build
    python-wheel python-pytest
  )

  # Add build toolchain
  all_pkgs+=(ninja cmake)

  install_package_group "Core" "Development essentials" "${all_pkgs[@]}"
}

install_ros2() {
  header "ROS 2 ${ROS_DISTRO}"

  if [[ -d "/opt/ros/${ROS_DISTRO}" ]]; then
    ok "ROS 2 ${ROS_DISTRO} already installed at /opt/ros/${ROS_DISTRO}"
    return
  fi

  local ros_package="ros-${ROS_DISTRO}-desktop"

  if pacman -Qi "$ros_package" &>/dev/null; then
    ok "${ros_package} already installed via pacman"
    return
  fi

  warn "ROS 2 ${ROS_DISTRO} not found — installing from AUR (this is large, 2-5GB)"
  info "Installing ${ros_package}..."

  if [[ "$CI_MODE" == true ]]; then
    $AUR_HELPER -S --noconfirm --needed "$ros_package" 2>&1 | tee -a "$LOG_FILE"
  else
    $AUR_HELPER -S --needed "$ros_package" 2>&1 | tee -a "$LOG_FILE"
  fi
  ok "ROS 2 ${ROS_DISTRO} installed"

  # Source ROS in bashrc if not already there
  local ros_setup="/opt/ros/${ROS_DISTRO}/setup.bash"
  if [[ -f "$ros_setup" ]]; then
    if ! grep -q "source ${ros_setup}" ~/.bashrc 2>/dev/null; then
      echo "# ROS 2 ${ROS_DISTRO}" >> ~/.bashrc
      echo "source ${ros_setup}" >> ~/.bashrc
      info "Added ROS 2 source to ~/.bashrc"
    fi
  fi
}

install_px4_toolchain() {
  header "PX4 Toolchain"

  local px4_packages=(
    python-empy python-pyros-genmsg python-setuptools
    arm-none-eabi-gcc arm-none-eabi-binutils arm-none-eabi-newlib
  )

  install_package_group "PX4" "PX4 firmware compilation toolchain" "${px4_packages[@]}"

  # Python packages for PX4
  info "Installing PX4 Python dependencies"
  pip3 install --user --upgrade \
    empy pyros-genmsg setuptools \
    kconfiglib jsonschema toml 2>&1 | tee -a "$LOG_FILE"
  ok "PX4 Python tools installed"
}

install_px4_firmware() {
  header "PX4-Autopilot Firmware"

  local px4_dir="${PROJECT_ROOT}/third_party/PX4-Autopilot"

  if [[ -d "$px4_dir" ]]; then
    ok "PX4-Autopilot already cloned at ${px4_dir}"
    return
  fi

  info "Cloning PX4-Autopilot v1.15.0..."
  mkdir -p "${PROJECT_ROOT}/third_party"

  git clone --branch v1.15.0 --depth 1 \
    https://github.com/PX4/PX4-Autopilot.git "$px4_dir" 2>&1 | tee -a "$LOG_FILE"

  cd "$px4_dir"
  info "Initializing submodules..."
  git submodule update --init --recursive 2>&1 | tee -a "$LOG_FILE" &

  local sub_pid=$!
  spinner "$sub_pid"
  wait "$sub_pid"

  ok "PX4-Autopilot v1.15.0 cloned at ${px4_dir}"
}

install_gazebo() {
  header "Gazebo / Ignition"

  local gazebo_packages=(
    gz-garden
  )

  install_aur_package_group \
    "Gazebo" "Gazebo Garden (Fortress-class simulator)" \
    "${gazebo_packages[@]}"

  # Extra Gazebo models
  local gazebo_models_dir="${PROJECT_ROOT}/simulations/gazebo/models"
  if [[ -d "$gazebo_models_dir" ]]; then
    info "Gazebo models directory exists: ${gazebo_models_dir}"
  fi
}

install_jetson() {
  header "NVIDIA Jetson Toolchain"

  info "Jetson setup is intended to run ON the Jetson device"
  echo ""
  echo -e "  ${BOLD}To set up a Jetson Orin/Nano:${NC}"
  echo "    1. Install JetPack 6.2+ via SDK Manager on a host PC"
  echo "    2. Flash the JetPack image to the Jetson"
  echo "    3. On the Jetson, install:"
  echo "       sudo apt install python3-pip cmake build-essential"
  echo "       pip3 install --upgrade numpy opencv-python"
  echo ""

  # Install cross-compilation tools for Jetson (aarch64)
  local jetson_cross_packages=(
    aarch64-linux-gnu-gcc aarch64-linux-gnu-binutils
    qemu-user-static
  )

  install_package_group \
    "Jetson Cross" "aarch64 cross-compilation toolchain" \
    "${jetson_cross_packages[@]}" || warn "Some cross-compile packages may be unavailable on Arch"
}

install_firmware_tools() {
  header "Firmware Build Tools"

  # PlatformIO
  if command -v platformio &>/dev/null || pip3 show platformio &>/dev/null; then
    ok "PlatformIO already installed"
  else
    info "Installing PlatformIO..."
    pip3 install --user platformio 2>&1 | tee -a "$LOG_FILE"
    ok "PlatformIO installed"
  fi

  # ESP32 toolchain
  if command -v idf.py &>/dev/null; then
    ok "ESP-IDF already installed"
  else
    warn "ESP-IDF not found. To install ESP32 toolchain:"
    echo "    git clone --recursive https://github.com/espressif/esp-idf.git"
    echo "    cd esp-idf && ./install.sh"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
# 3. PYTHON VIRTUAL ENVIRONMENT
# ═════════════════════════════════════════════════════════════════════════════

setup_python_env() {
  header "Python Virtual Environment"

  local venv_path="${PROJECT_ROOT}/.venv"

  if [[ -d "$venv_path" ]]; then
    ok "Virtual environment exists at ${venv_path}"
  else
    info "Creating Python virtual environment..."
    python3 -m venv "$venv_path" 2>&1 | tee -a "$LOG_FILE"
    ok "Virtual environment created"
  fi

  info "Activating and upgrading pip..."
  # shellcheck disable=SC1091
  source "${venv_path}/bin/activate"
  pip install --upgrade pip wheel setuptools 2>&1 | tee -a "$LOG_FILE"
  ok "pip upgraded"

  # Install requirements
  local req_file="${PROJECT_ROOT}/requirements.txt"
  if [[ -f "$req_file" ]]; then
    info "Installing requirements.txt..."
    pip install -r "$req_file" 2>&1 | tee -a "$LOG_FILE"
    ok "Python dependencies installed"
  else
    warn "No requirements.txt found at ${req_file}"
    info "Creating default requirements.txt..."
    cat > "$req_file" << 'REQEOF'
numpy>=1.24
opencv-python>=4.8
transforms3d>=0.4
pyulog>=0.7
empy>=3.3.4
catkin-pkg>=0.5
pyros-genmsg>=0.2
mavsdk>=3.0
dronecan>=2.0
requests>=2.31
pyserial>=3.5
tabulate>=0.9
colorama>=0.4
REQEOF
    pip install -r "$req_file" 2>&1 | tee -a "$LOG_FILE"
    ok "Default requirements installed"
  fi

  deactivate
  ok "Python virtual environment ready — activate with: source ${venv_path}/bin/activate"
}

# ═════════════════════════════════════════════════════════════════════════════
# 4. ROS 2 WORKSPACE
# ═════════════════════════════════════════════════════════════════════════════

setup_ros2_workspace() {
  header "ROS 2 Workspace"

  local ws_dir="${PROJECT_ROOT}/ros2_ws"

  mkdir -p "${ws_dir}/src"

  if [[ -d "${ws_dir}/build" ]]; then
    ok "ROS 2 workspace already built"
    return
  fi

  info "Checking if ROS 2 is sourced..."
  local ros_setup="/opt/ros/${ROS_DISTRO}/setup.bash"

  if [[ ! -f "$ros_setup" ]]; then
    warn "ROS 2 not found at ${ros_setup} — skipping workspace build"
    return
  fi

  if [[ -z "$(ls -A "${ws_dir}/src" 2>/dev/null)" ]]; then
    info "ROS 2 workspace src directory is empty — skipping colcon build"
    return
  fi

  info "Building ROS 2 workspace..."
  # shellcheck disable=SC1090
  source "$ros_setup"
  cd "$ws_dir"
  colcon build --symlink-install 2>&1 | tee -a "$LOG_FILE"

  # Add workspace to bashrc
  local setup_script="${ws_dir}/install/setup.bash"
  if [[ -f "$setup_script" ]] && ! grep -q "$setup_script" ~/.bashrc 2>/dev/null; then
    echo "# AndinoDroneLab ROS 2 workspace" >> ~/.bashrc
    echo "source ${setup_script}" >> ~/.bashrc
    info "Added workspace source to ~/.bashrc"
  fi

  ok "ROS 2 workspace built at ${ws_dir}"
}

# ═════════════════════════════════════════════════════════════════════════════
# 5. DIRECTORY STRUCTURE
# ═════════════════════════════════════════════════════════════════════════════

create_directory_structure() {
  header "Directory Structure Validation"

  local dirs=(
    "${PROJECT_ROOT}/docs/hardware"
    "${PROJECT_ROOT}/ros2_ws/src"
    "${PROJECT_ROOT}/firmware/flight_controller"
    "${PROJECT_ROOT}/firmware/esp32_telemetry"
    "${PROJECT_ROOT}/hardware/schematics"
    "${PROJECT_ROOT}/hardware/pcb"
    "${PROJECT_ROOT}/hardware/cad"
    "${PROJECT_ROOT}/simulations/gazebo/worlds"
    "${PROJECT_ROOT}/simulations/gazebo/models"
    "${PROJECT_ROOT}/scripts"
    "${PROJECT_ROOT}/projects"
    "${PROJECT_ROOT}/logs"
    "${PROJECT_ROOT}/third_party"
  )

  local created=0
  for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      :  # exists, skip
    else
      mkdir -p "$dir"
      created=$((created + 1))
    fi
  done

  if [[ $created -gt 0 ]]; then
    info "Created ${created} missing directories"
  else
    ok "All project directories exist"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
# 6. GIT HOOKS
# ═════════════════════════════════════════════════════════════════════════════

setup_git_hooks() {
  header "Git Hooks"

  local hooks_dir="${PROJECT_ROOT}/.git/hooks"
  local precommit_config="${PROJECT_ROOT}/.pre-commit-config.yaml"

  if [[ ! -d "$hooks_dir" ]]; then
    warn "No .git directory found — skipping hooks"
    return
  fi

  if [[ -f "$precommit_config" ]]; then
    if command -v pre-commit &>/dev/null; then
      info "Installing pre-commit hooks..."
      cd "$PROJECT_ROOT"
      pre-commit install 2>&1 | tee -a "$LOG_FILE"
      ok "pre-commit hooks installed"
    else
      warn "pre-commit config found but pre-commit not installed"
      info "Installing pre-commit..."
      pip3 install --user pre-commit 2>&1 | tee -a "$LOG_FILE"
      cd "$PROJECT_ROOT"
      pre-commit install 2>&1 | tee -a "$LOG_FILE"
      ok "pre-commit installed and hooks configured"
    fi
  else
    info "No .pre-commit-config.yaml found — skipping hook setup"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
# 7. FIRMWARE BUILD
# ═════════════════════════════════════════════════════════════════════════════

build_firmware_targets() {
  header "Firmware Build"

  # Flight controller
  local fc_dir="${PROJECT_ROOT}/firmware/flight_controller"
  if [[ -f "${fc_dir}/platformio.ini" ]]; then
    info "Building flight controller firmware..."
    cd "$fc_dir"
    if command -v platformio &>/dev/null; then
      platformio run 2>&1 | tee -a "$LOG_FILE" && \
        ok "Flight controller firmware built" || \
        warn "Flight controller build failed"
    else
      warn "platformio not available — skipping firmware build"
    fi
  else
    warn "No platformio.ini in ${fc_dir} — skipping flight controller build"
  fi

  # ESP32 telemetry
  local esp_dir="${PROJECT_ROOT}/firmware/esp32_telemetry"
  if [[ -f "${esp_dir}/platformio.ini" ]]; then
    info "Building ESP32 telemetry firmware..."
    cd "$esp_dir"
    if command -v platformio &>/dev/null; then
      platformio run 2>&1 | tee -a "$LOG_FILE" && \
        ok "ESP32 telemetry firmware built" || \
        warn "ESP32 telemetry build failed"
    else
      warn "platformio not available — skipping ESP32 build"
    fi
  else
    warn "No platformio.ini in ${esp_dir} — skipping ESP32 build"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
# 8. SUMMARY
# ═════════════════════════════════════════════════════════════════════════════

print_summary() {
  header "Setup Summary"

  echo -e "  ${BOLD}Environment:${NC}"
  echo -e "    Project root : ${PROJECT_ROOT}"
  echo -e "    Python venv  : ${PROJECT_ROOT}/.venv"
  echo -e "    ROS 2 distro : ${ROS_DISTRO}"
  echo -e "    ROS 2 ws     : ${PROJECT_ROOT}/ros2_ws"
  echo ""
  echo -e "  ${BOLD}Quick commands:${NC}"
  echo -e "    Activate venv  : source ${PROJECT_ROOT}/.venv/bin/activate"
  echo -e "    Source ROS     : source /opt/ros/${ROS_DISTRO}/setup.bash"
  echo -e "    Build ROS ws   : cd ${PROJECT_ROOT}/ros2_ws && colcon build"
  echo -e "    Build PX4      : cd ${PROJECT_ROOT}/third_party/PX4-Autopilot && make px4_sitl"
  echo -e "    Run simulation : ./scripts/run_simulation.sh"
  echo -e "    Flash firmware : ./scripts/flash_firmware.sh"
  echo ""
  echo -e "  ${BOLD}Docs:${NC}"
  echo -e "    ${PROJECT_ROOT}/docs/"
  echo ""
  echo -e "  ${DIM}Setup log: ${LOG_FILE}${NC}"
}

# ═════════════════════════════════════════════════════════════════════════════
# ── MAIN ─────────────────────────────────────────────────────────────────────
# ═════════════════════════════════════════════════════════════════════════════

main() {
  check_system
  create_directory_structure
  install_core_packages
  install_ros2
  setup_python_env

  if [[ "$INSTALL_PX4" == true ]]; then
    install_px4_toolchain
    install_px4_firmware
  fi

  if [[ "$INSTALL_GAZEBO" == true ]]; then
    install_gazebo
  fi

  if [[ "$INSTALL_JETSON" == true ]]; then
    install_jetson
  fi

  if [[ "$INSTALL_FIRMWARE" == true ]]; then
    install_firmware_tools
    build_firmware_targets
  fi

  setup_ros2_workspace
  setup_git_hooks
  print_summary
}

main "$@"
