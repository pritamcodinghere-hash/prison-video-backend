const prisma = require("../config/prisma");

const getWallet = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        let wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { userId, balance: 0 }
            });
        }

        return res.status(200).json({ wallet });

    } catch (error) {
        console.error("GET WALLET ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const deposit = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: "Valid amount is required" });
        }

        let wallet = await prisma.wallet.findUnique({ where: { userId } });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { userId, balance: Number(amount) }
            });
        } else {
            wallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: Number(amount) } }
            });
        }

        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: Number(amount),
                type: "CREDIT"
            }
        });

        return res.status(200).json({ message: "Deposit successful", wallet });

    } catch (error) {
        console.error("DEPOSIT ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const deduct = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { amount, callId } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: "Valid amount is required" });
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } });

        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        if (Number(wallet.balance) < Number(amount)) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: Number(amount) } }
        });

        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: Number(amount),
                type: "DEBIT",
                callId: callId ? Number(callId) : null
            }
        });

        return res.status(200).json({ message: "Deduction successful", wallet: updatedWallet });

    } catch (error) {
        console.error("DEDUCT ERROR:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getWallet, deposit, deduct };
