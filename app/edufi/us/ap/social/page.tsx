"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, BookMarked, Coins, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function APSocialSciencesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-8">
        <Link href="/edufi/us/ap">
          <Button variant="ghost" size="sm" className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">AP Social Sciences</h1>
          <p className="text-muted-foreground mt-2">
            Select a course to access study materials and resources
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AP Psychology Card */}
        <Link href="/edufi/us/ap/social/psychology" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <CardTitle>AP Psychology</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Explore human behavior and mental processes with interactive case studies and practice assessments.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Interactive case studies
            </CardFooter>
          </Card>
        </Link>

        {/* AP US History Card */}
        <Link href="/edufi/us/ap/social/us-history" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <BookMarked className="h-6 w-6 text-primary" />
                <CardTitle>AP US History</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Study American history from pre-Columbian societies to the present with primary source analysis and timelines.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Interactive timelines
            </CardFooter>
          </Card>
        </Link>

        {/* AP Economics Card */}
        <Link href="/edufi/us/ap/social/economics" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Coins className="h-6 w-6 text-primary" />
                <CardTitle>AP Economics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Learn microeconomics and macroeconomics principles with real-world applications and market simulations.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Market simulation tools
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
