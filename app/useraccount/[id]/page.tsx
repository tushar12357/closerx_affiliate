"use client";
import React, { useEffect, useState, useRef } from "react";
import { useGetUserData } from "../../api/api";
import { useParams, useRouter } from "next/navigation";
import { useEditName, useProfileImage } from "../../api/api";
import { UserDropdown } from "@/components/UserDropdown";

const UserAccount = () => {
  const router=useRouter()
  const { id } = useParams();
  const { data, isLoading, isError } = useGetUserData(id);
  const editNameMutation = useEditName();
  const profileImageMutation = useProfileImage();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data?.success && data.data.user) {
      const user = data.data.user;
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setContactNumber(user.contact_number || "");
    }
  }, [data]);

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <header className="bg-background-color-secondary shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
             <button
              onClick={() => router.push("/")}
              className="mr-4 text-white hover:text-gray-200 focus:outline-none"
              aria-label="Go back to home"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
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
      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center bg-white rounded-xl shadow-md">
              <div className="text-lg font-semibold text-gray-600 animate-pulse">
                Loading...
              </div>
            </div>
          ) : isError || !data?.success ? (
            <div className="flex min-h-[400px] items-center justify-center bg-white rounded-xl shadow-md">
              <div className="text-lg font-semibold text-red-600">
                Error loading user data
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-purple-700 mb-6">
                Account Settings
              </h2>
              <form className="flex flex-col sm:flex-row gap-8">
                {/* Profile Image Section */}
                <div className="flex flex-col items-center sm:w-1/3">
                  <div className="relative">
                    {data.data.user.profile_picture ? (
                      <img
                        src={data.data.user.profile_picture}
                        alt="Profile"
                        className="w-48 h-48 rounded-full object-cover border-4 border-purple-100 shadow-md mb-4"
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-full bg-purple-50 flex items-center justify-center text-gray-500 text-sm font-medium border-4 border-purple-100 shadow-md mb-4">
                        No Image
                      </div>
                    )}
                  </div>
                  {/* Disabled file input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    disabled
                    className="hidden"
                  />
                </div>

                {/* User Info Section */}
                <div className="sm:w-2/3 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      disabled
                      className="mt-1 h-10 block w-full rounded-lg border-gray-200 bg-gray-100 shadow-sm sm:text-sm px-3 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      disabled
                      className="mt-1 h-10 block w-full rounded-lg border-gray-200 bg-gray-100 shadow-sm sm:text-sm px-3 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={data.data.user.email}
                      disabled
                      className="mt-1 h-10 block w-full rounded-lg border-gray-200 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      disabled
                      className="mt-1 h-10 block w-full rounded-lg border-gray-200 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed px-3"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserAccount;
