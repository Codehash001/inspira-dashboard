"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Languages, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function APLanguagesPage() {
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
          <h1 className="text-3xl font-bold">AP Languages</h1>
          <p className="text-muted-foreground mt-2">
            Select a course to access study materials and resources
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AP English Literature Card */}
        <Link href="/edufi/us/ap/languages/english-literature" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>AP English Literature</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Analyze literary works, develop critical reading skills, and practice essay writing with interactive tools.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Literary analysis tools
            </CardFooter>
          </Card>
        </Link>

        {/* AP Spanish Language Card */}
        <Link href="/edufi/us/ap/languages/spanish" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Languages className="h-6 w-6 text-primary" />
                <CardTitle>AP Spanish Language</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Develop Spanish language proficiency through interactive conversations, cultural studies, and writing practice.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Conversational practice
            </CardFooter>
          </Card>
        </Link>

        {/* AP Mandarin Card */}
        <Link href="/edufi/us/ap/languages/mandarin" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Languages className="h-6 w-6 text-primary" />
                <CardTitle>AP Mandarin</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Learn Mandarin Chinese language and culture with character recognition tools and conversation practice.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              Character recognition tools
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
