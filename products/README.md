# ARKELYTHEX Products

> Cada producto es una vertical independiente con su propio repositorio en GitHub.

## Product Matrix

| Product     | Repo                                                                   | Description                          |
| ----------- | ---------------------------------------------------------------------- | ------------------------------------ |
| **Drenyra** | [github.com/arkelythex/drenyra](https://github.com/arkelythex/drenyra) | 🏦 OS Fiscal — Contabilidad con IA   |
| **Andino**  | [github.com/arkelythex/andino](https://github.com/arkelythex/andino)   | 🚁 OS Drones — Robótica autónoma     |
| **ForgeOS** | [github.com/arkelythex/forgeos](https://github.com/arkelythex/forgeos) | 🏗️ OS Fabricación — Procesos físicos |
| **Senzar**  | [github.com/arkelythex/senzar](https://github.com/arkelythex/senzar)   | 🌾 OS Agroindustria — Trazabilidad   |
| **Estado**  | [github.com/arkelythex/estado](https://github.com/arkelythex/estado)   | 🏛️ OS Gobierno — Civic tech          |
| **Kuse**    | [github.com/arkelythex/kuse](https://github.com/arkelythex/kuse)       | 💻 OS Escritorio — Productividad     |
| **Elvyra**  | [github.com/arkelythex/elvyra](https://github.com/arkelythex/elvyra)   | ⚖️ OS Legal — Command Center         |

## Architecture

Cada producto es un repositorio independiente con:

- Su propio git history y CI/CD
- Su package manager y tooling
- Su release cycle
- Cero dependencia de acoplamiento con otros productos

Los paquetes compartidos viven en `packages/` bajo `arkelythex/Arkelythex` y se publican a npm como `@arkelythex/*`.

## Clasificación

| Layer             | Criterion                       | Products                              |
| ----------------- | ------------------------------- | ------------------------------------- |
| 🚀 **Product**    | Usuarios reales, tests, release | drenyra, andino, senzar, estado, kuse |
| 🔬 **Lab**        | Experimental, validación        | forgeos                               |
| 📐 **Foundation** | Inteligencia, estándares        | elvyra                                |
