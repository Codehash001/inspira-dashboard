import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const walletId = params.userId;

    if (!walletId) {
      return new NextResponse("Wallet ID is required", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        walletId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
