'use client';

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
      title: "You're on the list!",
      description: "We'll notify you when this exciting feature launches.",
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
            We're working on something special that will revolutionize your change management experience.
          </p>
        </div>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Mystery Feature
            </CardTitle>
            <CardDescription className="text-center">
              Stay tuned for an announcement that will transform your workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Coming Soon</span>
            </div>

            <form onSubmit={handleNotifyMe} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email to be notified"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button type="submit" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notify Me
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">Innovative</h3>
                    <p className="text-sm text-muted-foreground">
                      A fresh approach to change management
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Enterprise-grade security
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">Intelligent</h3>
                    <p className="text-sm text-muted-foreground">
                      Powered by cutting-edge technology
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 