const prisma = require("../config/prisma");

const getAlerts = async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            include: { user: { select: { id: true, fullName: true, email: true } } },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ alerts });

    } catch (error) {
        console.error("GET ALERTS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const resolveAlert = async (req, res) => {
    try {
        const alertId = Number(req.params.id);

        const alert = await prisma.alert.findUnique({ where: { id: alertId } });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const updated = await prisma.alert.update({
            where: { id: alertId },
            data: { status: "RESOLVED", resolvedAt: new Date() }
        });

        return res.status(200).json({ message: "Alert resolved", alert: updated });

    } catch (error) {
        console.error("RESOLVE ALERT ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const createAlert = async (req, res) => {
    try {
        const { type, message, severity, userId } = req.body;

        if (!type || !message) {
            return res.status(400).json({ message: "type and message are required" });
        }

        const alert = await prisma.alert.create({
            data: {
                type,
                message,
                severity: severity || "MEDIUM",
                userId: userId ? Number(userId) : null
            }
        });

        return res.status(201).json({ message: "Alert created", alert });

    } catch (error) {
        console.error("CREATE ALERT ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getAlerts, resolveAlert, createAlert };
