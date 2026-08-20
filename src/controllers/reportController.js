const prisma = require("../config/prisma");

const getCallStats = async (req, res) => {
    try {
        const { range } = req.query;
        const now = new Date();
        let startDate;

        if (range === "weekly") {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (range === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        const calls = await prisma.call.findMany({
            where: { createdAt: { gte: startDate } }
        });

        const totalCalls = calls.length;
        const completedCalls = calls.filter(c => c.status === "COMPLETED").length;
        const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
        const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

        const billings = await prisma.billing.findMany({
            where: { createdAt: { gte: startDate } }
        });
        const totalRevenue = billings.reduce((sum, b) => sum + Number(b.amount), 0);

        return res.status(200).json({
            range: range || "daily",
            startDate,
            totalCalls,
            completedCalls,
            totalDuration,
            avgDuration,
            totalRevenue
        });

    } catch (error) {
        console.error("GET CALL STATS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getCallStats };
