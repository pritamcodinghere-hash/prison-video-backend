const prisma = require("../config/prisma");

const getDashboardStats = async (req, res) => {
    try {
        const totalInmates = await prisma.inmate.count({
            where: { status: "ACTIVE" }
        });

        const activeCalls = await prisma.call.count({
            where: { status: "ACTIVE" }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCalls = await prisma.call.count({
            where: { createdAt: { gte: today } }
        });

        const todayBillings = await prisma.billing.findMany({
            where: { createdAt: { gte: today } }
        });
        const revenue = todayBillings.reduce((sum, b) => sum + Number(b.amount), 0);

        const openAlerts = await prisma.alert.count({
            where: { status: "OPEN" }
        });

        const totalKiosks = await prisma.kiosk.count();
        const onlineKiosks = await prisma.kiosk.count({
            where: { status: "APPROVED" }
        });

        return res.status(200).json({
            totalInmates,
            activeCalls,
            todayCalls,
            revenue,
            openAlerts,
            totalKiosks,
            onlineKiosks
        });

    } catch (error) {
        console.error("GET DASHBOARD STATS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getDashboardStats };
