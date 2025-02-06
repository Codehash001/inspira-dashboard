import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletId = searchParams.get("walletId");

    if (!walletId) {
      return new NextResponse("Wallet ID is required", { status: 401 });
    }

    // Delete all related records first
    await Promise.all([
      prisma.creditBalance.deleteMany({
        where: { walletId },
      }),
      prisma.chatHistory.deleteMany({
        where: { walletId },
      }),
      prisma.imageGenerationHistory.deleteMany({
        where: { walletId },
      }),
      prisma.videoGenerationHistory.deleteMany({
        where: { walletId },
      }),
      prisma.bookGradingHistory.deleteMany({
        where: { walletId },
      }),
      prisma.transaction.deleteMany({
        where: { walletId },
      }),
    ]);

    // Finally, delete the user
    await prisma.user.delete({
      where: {
        walletId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SETTINGS_DELETE_ACCOUNT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
