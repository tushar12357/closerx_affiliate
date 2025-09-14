"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

import AffiliateDashboard from "../components/AffiliateDashboard";
import { UserDropdown } from "../components/UserDropdown";

function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background-color-secondary shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="https://new-closerx.s3.amazonaws.com/media/Whitelabel_domains/CloserX.ai_Logo_1_wLcruQT.png"
              alt="CloserX Logo"
              className="h-8 w-auto mr-2"
            />
            <h1 className="text-2xl font-bold text-white">
              CloserX Affiliate Dashboard
            </h1>
          </div>
          <UserDropdown />
        </div>
      </header>
      <main className="flex-grow">
        <AffiliateDashboard />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
