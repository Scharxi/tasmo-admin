"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@radix-ui/react-avatar";

export function LogoutButton() {
  const { data: session, status } = useSession();

  // Debug: Always show button for now
  console.log("Session status:", status, "Session data:", session);

  if (status === "loading") {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <Avatar className="h-8 w-8">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <User className="h-4 w-4 text-gray-400" />
          </div>
        </Avatar>
      </Button>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Button 
        variant="ghost" 
        className="relative h-8 w-8 rounded-full"
        onClick={() => window.location.href = '/auth/signin'}
      >
        <Avatar className="h-8 w-8">
          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <User className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
        </Avatar>
      </Button>
    );
  }

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/auth/signin",
      redirect: true,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session?.user?.name || "Benutzer"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email || session?.user?.username || ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 