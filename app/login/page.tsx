"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { LoginScene } from "./LoginScene";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Login } from "../api/api";
import Cookies from "js-cookie";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function SimpleLoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();


  
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const userId = searchParams.get("user_id");
  useEffect(() => {
    if (accessToken && refreshToken && userId) {
      Cookies.set("access_token", accessToken);
      Cookies.set("refresh_token", refreshToken);
      Cookies.set("user_id", userId);
      router.push("/");
    }
  }, [searchParams, router]);

  const loginMutation = useMutation({
    mutationFn: Login,
    onSuccess: (data) => {
      Cookies.set("access_token", data.data.access_token);
      Cookies.set("refresh_token", data.data.refresh_token);
      Cookies.set("user_id", data.data.user.id);

      router.push("/"); // redirect after success
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="md:basis-[50%] flex items-center justify-center p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600">
              Please enter your details to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  } focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  } focus:border-primary/30 focus:ring-2 focus:ring-primary/20 transition-all`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 btn-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Sign in
                </>
              )}
            </button>

            {loginMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                {(loginMutation.error as any)?.response?.data?.message ||
                  "Login failed"}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="hidden sm:block w-full bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
        <LoginScene />
      </div>
    </div>
  );
}
