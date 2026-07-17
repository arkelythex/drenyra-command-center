function totalModelCost(model) {
    return model.cost.costPer1MInput + model.cost.costPer1MOutput;
}
function hasAllCapabilities(model, required) {
    return required.every((cap) => model.capabilities.includes(cap));
}
export class ModelRegistry {
    models = new Map();
    register(model) {
        this.models.set(model.id, model);
    }
    get(id) {
        return this.models.get(id);
    }
    list() {
        return Array.from(this.models.values());
    }
    selectByCapability(capabilities) {
        return this.list()
            .filter((model) => (capabilities.length === 0 ? true : hasAllCapabilities(model, capabilities)))
            .sort((a, b) => totalModelCost(a) - totalModelCost(b));
    }
    remove(id) {
        return this.models.delete(id);
    }
}
//# sourceMappingURL=registry.js.map