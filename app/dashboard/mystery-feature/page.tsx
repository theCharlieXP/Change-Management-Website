"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, Bell } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function MysteryFeaturePage() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "You&apos;re on the list!",
      description: "We&apos;ll notify you when this exciting feature launches.",
    });
    setEmail("");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Something Exciting is Coming
          </h1>
          <p className="text-xl text-muted-foreground">
            We&apos;re working on something special that will revolutionize your change management experience.
          </p>
          <p className="text-lg text-muted-foreground">
            Stay tuned for the big reveal – it's going to change everything about how you work.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Mystery Feature</CardTitle>
            <CardDescription className="text-center">
              Be the first to know when we launch our groundbreaking new feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <p>Currently in development</p>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Bell className="h-5 w-5" />
                <p>Sign up for notifications</p>
              </div>
              <form onSubmit={handleNotifyMe} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-2 border rounded-md"
                  required
                />
                <Button type="submit" className="w-full">
                  Notify Me
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 