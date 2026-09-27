import { NubeFactProvider } from "./nubefact.provider";
import { SimulationOSEProvider } from "./simulation.provider";
export class OSEProviderFactory {
    static create(config) {
        switch (config.provider) {
            case "nubefact":
                return new NubeFactProvider(config);
            case "bizlinks":
                throw new Error("Bizlinks provider not yet implemented. Use OSE_PROVIDER=nubefact or OSE_SIMULATION_MODE=true while Bizlinks adapter is integrated.");
            case "custom":
                throw new Error("Custom OSE provider not yet implemented");
            case "simulation":
                return new SimulationOSEProvider(config);
            default:
                throw new Error(`Unknown OSE provider: ${config.provider}`);
        }
    }
}
//# sourceMappingURL=factory.js.map