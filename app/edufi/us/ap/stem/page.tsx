"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Atom, Code, Beaker, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function APStemPage() {
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
          <h1 className="text-3xl font-bold">AP STEM Courses</h1>
          <p className="text-muted-foreground mt-2">
            Select a course to access study materials and resources
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AP Calculus AB Card */}
        <Link href="/edufi/us/ap/stem/calculus-ab" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Atom className="h-6 w-6 text-primary" />
                <CardTitle>AP Calculus AB</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Study limits, derivatives, integrals, and the Fundamental Theorem of Calculus with interactive learning tools.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Interactive tutor available
            </CardFooter>
          </Card>
        </Link>

        {/* AP Physics 1 Card */}
        <Link href="/edufi/us/ap/stem/physics-1" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Atom className="h-6 w-6 text-primary" />
                <CardTitle>AP Physics 1</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Explore algebra-based physics concepts including mechanics, waves, and electricity with practice problems.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Interactive simulations
            </CardFooter>
          </Card>
        </Link>

        {/* AP Computer Science A Card */}
        <Link href="/edufi/us/ap/stem/computer-science-a" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Code className="h-6 w-6 text-primary" />
                <CardTitle>AP Computer Science A</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Learn Java programming fundamentals, object-oriented design, and algorithms with coding exercises.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Code practice environment
            </CardFooter>
          </Card>
        </Link>

        {/* AP Chemistry Card */}
        <Link href="/edufi/us/ap/stem/chemistry" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Beaker className="h-6 w-6 text-primary" />
                <CardTitle>AP Chemistry</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Study atomic structure, chemical reactions, thermodynamics, and equilibrium with virtual lab simulations.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Virtual lab experiments
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
