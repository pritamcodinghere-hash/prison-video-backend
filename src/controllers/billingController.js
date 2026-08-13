const prisma = require("../config/prisma");

// ==========================================
// CREATE BILLING FOR COMPLETED CALL
// ==========================================

const createBilling = async (req, res) => {
    try {
        const {
            callId,
            pricePerMinute
        } = req.body;

        if (!callId || !pricePerMinute) {
            return res.status(400).json({
                message: "callId and pricePerMinute are required"
            });
        }

        // Find call
        const call = await prisma.call.findUnique({
            where: {
                id: Number(callId)
            }
        });

        if (!call) {
            return res.status(404).json({
                message: "Call not found"
            });
        }

        // Billing only after call completion
        if (call.status !== "COMPLETED") {
            return res.status(400).json({
                message: "Billing can only be created for completed calls"
            });
        }

        // Check existing billing
        const existingBilling = await prisma.billing.findUnique({
            where: {
                callId: Number(callId)
            }
        });

        if (existingBilling) {
            return res.status(409).json({
                message: "Billing already exists for this call",
                billing: existingBilling
            });
        }

        const durationSeconds = call.duration || 0;

        // Convert seconds to minutes.
        // Minimum billable duration = 1 minute.
        const durationMinutes = Math.max(
            1,
            Math.ceil(durationSeconds / 60)
        );

        const price = Number(pricePerMinute);

        if (price <= 0) {
            return res.status(400).json({
                message: "pricePerMinute must be greater than 0"
            });
        }

        const amount = durationMinutes * price;

        const billing = await prisma.billing.create({
            data: {
                callId: Number(callId),
                amount,
                pricePerMinute: price,
                duration: durationMinutes,
                status: "PENDING"
            }
        });

        return res.status(201).json({
            message: "Billing created successfully",
            billing
        });

    } catch (error) {
        console.error("CREATE BILLING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// GET BILLING BY CALL
// ==========================================

const getBillingByCall = async (req, res) => {
    try {
        const callId = Number(req.params.callId);

        const billing = await prisma.billing.findUnique({
            where: {
                callId
            }
        });

        if (!billing) {
            return res.status(404).json({
                message: "Billing not found"
            });
        }

        return res.status(200).json({
            message: "Billing fetched successfully",
            billing
        });

    } catch (error) {
        console.error("GET BILLING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE BILLING STATUS
// ==========================================

const updateBillingStatus = async (req, res) => {
    try {
        const billingId = Number(req.params.id);
        const { status, transactionId } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "status is required"
            });
        }

        const allowedStatuses = [
            "PENDING",
            "PAID",
            "FAILED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid billing status"
            });
        }

        const billing = await prisma.billing.findUnique({
            where: {
                id: billingId
            }
        });

        if (!billing) {
            return res.status(404).json({
                message: "Billing not found"
            });
        }

        const updatedBilling = await prisma.billing.update({
            where: {
                id: billingId
            },
            data: {
                status,
                transactionId: transactionId || billing.transactionId
            }
        });

        return res.status(200).json({
            message: "Billing status updated successfully",
            billing: updatedBilling
        });

    } catch (error) {
        console.error("UPDATE BILLING ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createBilling,
    getBillingByCall,
    updateBillingStatus
};