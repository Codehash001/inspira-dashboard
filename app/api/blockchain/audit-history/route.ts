import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const headersList = headers()
    const walletId = headersList.get("Authorization")?.replace("Bearer ", "")

    if (!walletId) {
      return NextResponse.json(
        { error: "Unauthorized - Wallet address required" },
        { status: 401 }
      )
    }

    // Get user's audit history
    const audits = await prisma.smartContractAudit.findMany({
      where: {
        walletId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ audits })
  } catch (error) {
    console.error("Failed to fetch audit history:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit history" },
      { status: 500 }
    )
  }
}
