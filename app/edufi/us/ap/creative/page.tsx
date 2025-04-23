"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Music, Leaf, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function APCreativeStudiesPage() {
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
          <h1 className="text-3xl font-bold">AP Creative Studies</h1>
          <p className="text-muted-foreground mt-2">
            Select a course to access study materials and resources
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AP Studio Art Card */}
        <Link href="/edufi/us/ap/creative/studio-art" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Palette className="h-6 w-6 text-primary" />
                <CardTitle>AP Studio Art</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Develop artistic skills and create a portfolio with digital tools and technique demonstrations.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Digital portfolio tools
            </CardFooter>
          </Card>
        </Link>

        {/* AP Music Theory Card */}
        <Link href="/edufi/us/ap/creative/music-theory" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-primary" />
                <CardTitle>AP Music Theory</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Study musical notation, composition, harmony, and ear training with interactive exercises.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Interactive notation tools
            </CardFooter>
          </Card>
        </Link>

        {/* Environmental Science Card */}
        <Link href="/edufi/us/ap/creative/environmental-science" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Leaf className="h-6 w-6 text-primary" />
                <CardTitle>Environmental Science</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Explore environmental systems, resource management, and sustainability with case studies and simulations.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Environmental simulations
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
