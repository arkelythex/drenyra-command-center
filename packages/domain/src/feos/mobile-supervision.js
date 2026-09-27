export class MobileSupervision {
    notifications = [];
    actions = [];
    addNotification(n) {
        this.notifications.push(n);
    }
    getNotifications(filter) {
        let result = this.notifications;
        if (filter?.unreadOnly)
            result = result.filter((n) => !n.read);
        return [...result].sort((a, b) => b.createdAt.unix - a.createdAt.unix);
    }
    markRead(id) {
        const n = this.notifications.find((n) => n.id === id);
        if (n)
            n.read = true;
    }
    recordAction(action) {
        this.actions.push(action);
    }
    getPendingCount() {
        return this.notifications.filter((n) => !n.read && n.priority === "urgent").length;
    }
}
//# sourceMappingURL=mobile-supervision.js.map