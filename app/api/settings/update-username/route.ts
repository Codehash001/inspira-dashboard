import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, walletId } = body;

    if (!walletId) {
      return new NextResponse("Wallet ID is required", { status: 401 });
    }

    if (!username) {
      return new NextResponse("Username is required", { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        walletId,
      },
      data: {
        username,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[SETTINGS_UPDATE_USERNAME]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
