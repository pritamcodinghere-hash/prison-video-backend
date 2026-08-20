const prisma = require("../config/prisma");

const registerDevice = async (req, res) => {
    try {
        const { familyMemberId, deviceFingerprint, deviceName } = req.body;

        if (!familyMemberId || !deviceFingerprint) {
            return res.status(400).json({ message: "familyMemberId and deviceFingerprint are required" });
        }

        const familyMember = await prisma.familyMember.findUnique({
            where: { id: Number(familyMemberId) }
        });

        if (!familyMember) {
            return res.status(404).json({ message: "Family member not found" });
        }

        const existing = await prisma.deviceRegistration.findUnique({
            where: {
                familyMemberId_deviceFingerprint: {
                    familyMemberId: Number(familyMemberId),
                    deviceFingerprint
                }
            }
        });

        if (existing) {
            await prisma.deviceRegistration.update({
                where: { id: existing.id },
                data: { lastUsedAt: new Date() }
            });
            return res.status(200).json({ message: "Device already registered", deviceId: existing.id });
        }

        const deviceCount = await prisma.deviceRegistration.count({
            where: { familyMemberId: Number(familyMemberId) }
        });

        if (deviceCount >= 3) {
            return res.status(400).json({ message: "Maximum 3 devices allowed per family member" });
        }

        const device = await prisma.deviceRegistration.create({
            data: {
                familyMemberId: Number(familyMemberId),
                deviceFingerprint,
                deviceName: deviceName || null
            }
        });

        return res.status(201).json({ message: "Device registered successfully", deviceId: device.id });

    } catch (error) {
        console.error("REGISTER DEVICE ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const verifyDevice = async (req, res) => {
    try {
        const { familyMemberId, deviceFingerprint } = req.body;

        if (!familyMemberId || !deviceFingerprint) {
            return res.status(400).json({ message: "familyMemberId and deviceFingerprint are required" });
        }

        const device = await prisma.deviceRegistration.findUnique({
            where: {
                familyMemberId_deviceFingerprint: {
                    familyMemberId: Number(familyMemberId),
                    deviceFingerprint
                }
            }
        });

        if (!device) {
            return res.status(200).json({ verified: false, message: "Device not registered" });
        }

        if (!device.isTrusted) {
            return res.status(200).json({ verified: false, message: "Device is blocked" });
        }

        await prisma.deviceRegistration.update({
            where: { id: device.id },
            data: { lastUsedAt: new Date() }
        });

        return res.status(200).json({ verified: true });

    } catch (error) {
        console.error("VERIFY DEVICE ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { registerDevice, verifyDevice };
