const prisma = require("../config/prisma");

const getSettings = async (req, res) => {
    try {
        let settings = await prisma.settings.findUnique({ where: { id: 1 } });

        if (!settings) {
            settings = await prisma.settings.create({
                data: { id: 1, data: {} }
            });
        }

        return res.status(200).json({ settings });

    } catch (error) {
        console.error("GET SETTINGS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ message: "data is required" });
        }

        let settings = await prisma.settings.findUnique({ where: { id: 1 } });

        if (!settings) {
            settings = await prisma.settings.create({
                data: { id: 1, data }
            });
        } else {
            settings = await prisma.settings.update({
                where: { id: 1 },
                data: { data }
            });
        }

        return res.status(200).json({ message: "Settings updated", settings });

    } catch (error) {
        console.error("UPDATE SETTINGS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getSettings, updateSettings };
