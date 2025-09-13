"use client";
import {
  CreditCardIcon,
  HelpCircle,
  LogOut,
  Receipt,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { baseURL,useGetUserData} from "@/app/api/api";
import { useRouter } from "next/navigation";
// import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import { toast } from "react-toastify";
import profile from "@/app/utils/profile.png";

interface UserData {
  data: {
    user: {
      profile_picture?: string;
      first_name?: string;
    };
    ghl_connected: boolean;
    salesforce_connected: boolean;
    term_condition_excepted: boolean;
    twilio_buy_hide: boolean;
    subscription_status: string;
    is_superuser: boolean;
    spreadsheet_connected: boolean;
    is_affiliate_patner: boolean;
  };
}

export function UserDropdown() {
  // const { id } = useUserStore();
  const id= Cookies.get("user_id")
  const { data: userData, isLoading } = useGetUserData(Number(id)) as {
    data: UserData | undefined;
    isLoading: boolean;
  };
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const accessToken = Cookies.get("access_token")
      const refreshToken = Cookies.get("refresh_token")
      if (!refreshToken) {
        toast.error("No refresh token found. Redirecting to login...");
        router.push("/login");
        return;
      }
      const response = await axios.post(
        `${baseURL}auth/logout/`,
        { refresh_token: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("user_id");
      localStorage.clear();
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      if (axios.isAxiosError(error) && error.response) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("companyName");
        localStorage.clear();
        router.push("/login");
        if (error.response.status === 400) {
          toast.error("Logout request was invalid. Please try again.");
        } else if (error.response.status === 401) {
          toast.error("Session expired. Redirecting to login...");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-2 md:p-5 text-base font-medium"
        >
          <Avatar className="w-7 h-7">
            <Image
              src={
                !userData?.data?.user?.profile_picture
                  ? profile
                  : userData?.data?.user?.profile_picture
              }
              alt="User Profile"
              width={30}
              height={10}
            />
          </Avatar>
          <span className="hidden md:inline text-primary">
            {isLoading ? "Loading..." : userData?.data?.user?.first_name || ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 max-w-[90vw] right-0 mt-2 bg-secondary layout-border-color"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-primary">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={`/useraccount/${id}`}>
            <DropdownMenuItem className="hover:cursor-pointer hover:bg-blue-500 text-primary flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="hover:cursor-pointer hover:bg-red-500 text-primary flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
