
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";


export const getBaseurl = () => {
  if (typeof window !== "undefined") {
    const isInIframe = window.top !== window.self;

    if (process.env.NODE_ENV === "development") {
      return "https://test.closerx.ai/api/";
    }else{
      return "https://app.closerx.ai/api/"
    }
  }

  // Fallback for server-side rendering (SSR)
  return "";
};

export const baseURL =getBaseurl()




const accessToken=Cookies.get("access_token")

export const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});


export const useGetUserData = (pk: number) => {
  return useQuery({
    queryKey: ["getUserData", pk],
    queryFn: async () => {
      const response = await axiosInstance.get(`user/${pk}/`);
      return response.data;
    },
  });
};



export const affiliateSummary=async()=>{
  const response=await axiosInstance.get('affiliate/me/summary/');
  return response.data;
}
export const affiliateCommissions=async()=>{
  const response=await axiosInstance.get('affiliate/me/commissions/');
  return response.data;
}
export const affiliateAttributions=async()=>{
  const response=await axiosInstance.get('affiliate/me/attributions/');
  return response.data;
}
export const requestWithdrawal = async (amountMinor: number, currency: string) => {
  const response = await axiosInstance.post('affiliate/me/withdrawals/', {
    amount_minor: amountMinor,
    currency: currency,
  });
  return response.data;
};
export const affiliate=async()=>{
  const response=await axiosInstance.post('affiliate/');
  return response.data;
}
export const getAffiliate=async()=>{
  const response=await axiosInstance.get('affiliate/');
  return response.data;
}
export const affiliateSubscription=async(data:any)=>{
  const response=await axiosInstance.post('affiliate/stripe/subscription-link/',data);
  return response.data;
}


export const getWithdrawalList=async()=>{
  const response=await axiosInstance.get('affiliate/me/withdrawals/list/')
  return response.data
}



export const useEditName = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.patch("update/full_name/", data);
      return response.data;
    },
    onError: (error) => {
      console.error("Failed to update full name:", error);
    },
    onSuccess: (data) => {
      console.log("Successfully updated full name:", data);
    },
  });
};

export const useProfileImage = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(
        "update_profile_picture/",
        data
      );
      return response.data;
    },
  });
};

export const Login=async(data:any)=>{
  const response=await axios.post(`${baseURL}auth/login/`,data)
  return response.data
}