"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Atom, Globe, Languages, Palette, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function APCategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-8">
        <Link href="/edufi/us">
          <Button variant="ghost" size="sm" className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Advanced Placement (AP)</h1>
          <p className="text-muted-foreground mt-2">
            Select a category to explore AP courses and resources
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* STEM Card */}
        <Link href="/edufi/us/ap/stem" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Atom className="h-6 w-6 text-primary" />
                <CardTitle>STEM</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Science, Technology, Engineering, and Mathematics courses including Calculus, Physics, Computer Science, and Chemistry.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              4 courses
            </CardFooter>
          </Card>
        </Link>

        {/* Social Sciences Card */}
        <Link href="/edufi/us/ap/social" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-6 w-6 text-primary" />
                <CardTitle>Social Sciences</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Explore social science courses including Psychology, US History, and Economics.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              3 courses
            </CardFooter>
          </Card>
        </Link>

        {/* Languages Card */}
        <Link href="/edufi/us/ap/languages" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Languages className="h-6 w-6 text-primary" />
                <CardTitle>Languages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Language and literature courses including English Literature, Spanish Language, and Mandarin.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              3 courses
            </CardFooter>
          </Card>
        </Link>

        {/* Creative Studies Card */}
        <Link href="/edufi/us/ap/creative" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Palette className="h-6 w-6 text-primary" />
                <CardTitle>Creative Studies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Arts and creative courses including Studio Art, Music Theory, and Environmental Science.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              3 courses
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
