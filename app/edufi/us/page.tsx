"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Atom, Globe, Languages, Palette, School } from "lucide-react"

export default function USEduFiPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">US Education Tools</h1>
        <p className="text-muted-foreground mt-2">
          Explore educational resources and tools for US education system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Advanced Placement (AP) Card */}
        <Link href="/edufi/us/ap" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <CardTitle>Advanced Placement (AP)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Access comprehensive resources for AP courses, including study materials, practice tests, and interactive learning tools.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              4 categories • 13 courses
            </CardFooter>
          </Card>
        </Link>

        {/* College Prep Card */}
        <Link href="/edufi/us/college-prep" className="block">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <School className="h-6 w-6 text-primary" />
                <CardTitle>College Prep</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Prepare for college applications with test prep resources, academic skill development, and career guidance tools.
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-2 text-sm text-muted-foreground">
              3 categories • 9 resources
            </CardFooter>
          </Card>
        </Link>
      </div>
    </div>
  )
}
