const prisma = require("../config/prisma");

const createIncident = async (req, res) => {
    try {
        const { inmateId, callId, type, severity, description } = req.body;

        if (!type || !severity || !description) {
            return res.status(400).json({ message: "type, severity and description are required" });
        }

        const incident = await prisma.incident.create({
            data: {
                inmateId: inmateId ? Number(inmateId) : null,
                callId: callId ? Number(callId) : null,
                type,
                severity,
                description
            }
        });

        return res.status(201).json({ message: "Incident created", incident });

    } catch (error) {
        console.error("CREATE INCIDENT ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getIncidents = async (req, res) => {
    try {
        const incidents = await prisma.incident.findMany({
            include: {
                inmate: { select: { id: true, fullName: true, inmateNumber: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ incidents });

    } catch (error) {
        console.error("GET INCIDENTS ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const updateIncidentStatus = async (req, res) => {
    try {
        const incidentId = Number(req.params.id);
        const { status } = req.body;

        const incident = await prisma.incident.update({
            where: { id: incidentId },
            data: { status }
        });

        return res.status(200).json({ message: "Incident updated", incident });

    } catch (error) {
        console.error("UPDATE INCIDENT ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createIncident, getIncidents, updateIncidentStatus };
