"use client";
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  affiliateAttributions,
  affiliateCommissions,
  affiliateSummary,
  requestWithdrawal,
  getAffiliate,
  getWithdrawalList,
  fetchPriceId,
  referralLink,
} from "@/app/api/api";

interface Partner {
  id: number;
  code: string;
  partner_type: string;
  user: number;
  email: string;
  display_name: string;
  stripe_connected_account: string | null;
  recurring_percent: string;
  first_payment_percent: string;
  is_active: boolean;
  created_at: string;
}

interface Totals {
  accrued_minor: number;
  paid_minor: number;
  approved_minor: number;
}

interface Summary {
  partner: Partner;
  currency: string;
  totals: Totals;
  available_for_withdraw_minor: number;
}

interface Commission {
  id: string;
  commission_type: string;
  currency: string;
  gross_invoice_amount_minor: number;
  commission_amount_minor: number;
  stripe_invoice_id: string;
  stripe_payment_intent_id: string | null;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
  partner: number;
  attribution: number;
}

interface Attribution {
  id: string;
  partner_email: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  campaign: string;
  first_payment_commission_paid: boolean;
  created_at: string;
  updated_at: string;
  partner: number;
  customer_email:string;
}

interface Withdrawal {
  id: number;
  amount_minor: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PriceIdResponse {
  success: boolean;
  errors: string[];
  response: {
    available_price_id: Record<string, string>;
  };
  message: string;
}

interface ReferralLinkResponse {
  success: boolean;
  errors: string[];
  response: {
    redirect_url: string;
  };
  message: string;
}

const AffiliateDashboard = () => {
  const queryClient = useQueryClient();
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState("summary");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState<Record<string, boolean>>({});
  // TanStack Query hooks for fetching data
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery<Summary>({
    queryKey: ["affiliateSummary"],
    queryFn: affiliateSummary,
  });

  const {
    data: commissions,
    isLoading: commissionsLoading,
    error: commissionsError,
  } = useQuery<Commission[]>({
    queryKey: ["affiliateCommissions"],
    queryFn: affiliateCommissions,
  });

  const {
    data: attributions,
    isLoading: attributionsLoading,
    error: attributionsError,
  } = useQuery<Attribution[]>({
    queryKey: ["affiliateAttributions"],
    queryFn: affiliateAttributions,
  });

  const {
    data: withdrawals,
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<Withdrawal[]>({
    queryKey: ["withdrawalList"],
    queryFn: getWithdrawalList,
  });

  const {
    data: priceIdData,
    isLoading: priceIdLoading,
    error: priceIdError,
  } = useQuery<PriceIdResponse>({
    queryKey: ["availablePriceIds"],
    queryFn: fetchPriceId,
  });

  const {
    data: affiliateData,
    isLoading: affiliateLoading,
    error: affiliateError,
  } = useQuery({
    queryKey: ["affiliateAccount"],
    queryFn: getAffiliate,
    retry: false,
  });

  // Mutation for submitting a withdrawal
  const withdrawalMutation = useMutation({
    mutationFn: () => requestWithdrawal(Number(withdrawalAmount) * 100, "USD"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliateSummary"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawalList"] });
      setWithdrawalAmount("");
      setErrorMessage(null);
      toast.success("Withdrawal request submitted successfully!");
    },
    onError: (error: Error) => {
      const message = error.message || "Failed to submit withdrawal request.";
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const referralLinkMutation = useMutation<ReferralLinkResponse, Error, string>(
    {
      mutationFn: referralLink,
      onMutate: (priceId) => {
        // Set loading state for the specific plan
        setLoadingPlans((prev) => ({ ...prev, [priceId]: true }));
      },
      onSuccess: (data, priceId) => {
        // Clear loading state for the specific plan
        setLoadingPlans((prev) => ({ ...prev, [priceId]: false }));
        toast.success("Referral link generated and copied!");
        if (data.success && data.response.redirect_url) {
          navigator.clipboard
            .writeText(data.response.redirect_url)
            .catch(() => {
              window.alert(`Referral link: ${data.response.redirect_url}`);
            });
        }
      },
      onError: (error, priceId) => {
        // Clear loading state for the specific plan
        setLoadingPlans((prev) => ({ ...prev, [priceId]: false }));
        const message = error.message || "Failed to generate referral link.";
        toast.error(message);
      },
    }
  );

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
      const message = "Please enter a valid withdrawal amount.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    if (
      summary &&
      Number(withdrawalAmount) * 100 > summary.available_for_withdraw_minor
    ) {
      const message =
        "Withdrawal amount exceeds available balance for withdrawal.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    withdrawalMutation.mutate();
  };

  const handleCopyReferralLink = async (planAmount: string) => {
    const priceId = priceIdData?.response?.available_price_id?.[planAmount];
    if (!priceId) {
      toast.error("Price ID not available. Please refresh.");
      return;
    }

    referralLinkMutation.mutate(priceId);
  };

  const formatCurrency = (minor: number) => `$${(minor / 100).toFixed(2)}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPlanAmount = (amount: string) => `$${parseInt(amount)}/mo`;

  const tabs = [
    { id: "summary", label: "Overview", icon: "📊" },
    { id: "plans", label: "Referral Plans", icon: "🔗" },
    { id: "commissions", label: "Commissions", icon: "💰" },
    { id: "attributions", label: "Attributions", icon: "👥" },
    { id: "withdrawals", label: "Withdrawals", icon: "💸" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-700">
                    Total Accrued
                  </p>
                  <span className="text-2xl">📈</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.totals.accrued_minor || 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-700">
                    Total Paid
                  </p>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.totals.paid_minor || 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-purple-700">
                    Total Approved
                  </p>
                  <span className="text-2xl">✔️</span>
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.totals.approved_minor || 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-sm border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-yellow-700">
                    Available for Withdrawal
                  </p>
                  <span className="text-2xl">💳</span>
                </div>
                <p className="text-3xl font-bold text-yellow-900">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(
                        summary?.available_for_withdraw_minor || 0
                      )}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💸</span> Request a Withdrawal
              </h3>
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="withdrawalAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    id="withdrawalAmount"
                    value={withdrawalAmount}
                    onChange={(e) => {
                      setWithdrawalAmount(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                    step="0.01"
                    min="0"
                  />
                  {errorMessage && (
                    <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={
                    withdrawalMutation.isPending ||
                    !summary ||
                    summary.available_for_withdraw_minor === 0
                  }
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    withdrawalMutation.isPending ||
                    !summary ||
                    summary.available_for_withdraw_minor === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "btn-primary"
                  }`}
                >
                  {withdrawalMutation.isPending
                    ? "Submitting..."
                    : "Request Withdrawal"}
                </button>
              </form>
              {summary && summary.available_for_withdraw_minor > 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  Available balance:{" "}
                  {formatCurrency(summary.available_for_withdraw_minor)}
                </p>
              )}
            </div>
          </>
        );

      case "plans":
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🔗</span> Your Referral Plans
              </h3>
              {priceIdLoading && (
                <div className="text-center text-gray-500 py-8">
                  Loading available plans...
                </div>
              )}
              {priceIdError && (
                <div className="text-center text-red-500 py-8">
                  Error loading plans: {(priceIdError as Error).message}
                </div>
              )}
              {priceIdData && priceIdData.success && (
                <>
                  <p className="text-sm text-gray-600 mb-6">
                    Share these referral links to earn commissions on new
                    subscriptions. Each successful signup earns you a percentage
                    of the subscription revenue.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(priceIdData.response.available_price_id)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([planAmount, priceId]) => (
                        <div
                          key={planAmount}
                          className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-purple-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-purple-900">
                              {formatPlanAmount(planAmount)}
                            </h4>
                            <span className="text-2xl">⭐</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                Link:
                              </span>
                              <button
                                onClick={() => handleCopyReferralLink(planAmount)}
                                disabled={loadingPlans[priceId] || false}
                                className={`flex-1 px-3 py-2 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                                  loadingPlans[priceId]
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-white border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {loadingPlans[priceId]
                                  ? "Generating..."
                                  : "Copy Referral Link"}
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-purple-100">
                            <p className="text-xs text-gray-600">
                              Earn {summary?.partner?.first_payment_percent}% on
                              first payment +{" "}
                              {summary?.partner?.recurring_percent}% recurring
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  {summary && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        💡 <strong>Total Referral Earnings:</strong>{" "}
                        {formatCurrency(summary.totals.accrued_minor)} |{" "}
                        <strong>Active Referrals:</strong>{" "}
                        {attributions?.filter(
                          (a) => a.first_payment_commission_paid
                        ).length || 0}
                      </p>
                    </div>
                  )}
                </>
              )}
              {!priceIdData?.success && priceIdData && (
                <div className="text-center text-red-500 py-8">
                  <p>Failed to load plans: {priceIdData.message}</p>
                  {priceIdData.errors.length > 0 && (
                    <ul className="mt-2 text-sm">
                      {priceIdData.errors.map((error, index) => (
                        <li key={index} className="list-disc list-inside">
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How Referrals Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">1</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Share Link</h4>
                  <p className="text-gray-600">
                    Send your unique referral link to potential customers
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">2</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Customer Signs Up
                  </h4>
                  <p className="text-gray-600">
                    They choose a plan and complete payment
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">3</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Earn Commission
                  </h4>
                  <p className="text-gray-600">
                    You earn commission automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "commissions":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {commissionsLoading && (
              <div className="p-6 text-center text-gray-500">
                Loading commissions...
              </div>
            )}
            {commissionsError && (
              <div className="p-6 text-center text-red-500">
                Error: {(commissionsError as Error).message}
              </div>
            )}
            {commissions && commissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commission.commission_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(
                            commission.gross_invoice_amount_minor
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(commission.commission_amount_minor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(commission.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                              commission.status
                            )}`}
                          >
                            {commission.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No commissions found.
              </div>
            )}
          </div>
        );

      case "attributions":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {attributionsLoading && (
              <div className="p-6 text-center text-gray-500">
                Loading attributions...
              </div>
            )}
            {attributionsError && (
              <div className="p-6 text-center text-red-500">
                Error: {(attributionsError as Error).message}
              </div>
            )}
            {attributions && attributions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Partner Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Payment Paid
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attributions.map((attribution) => (
                      <tr key={attribution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attribution.partner_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(attribution.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attribution?.customer_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              attribution.first_payment_commission_paid
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {attribution.first_payment_commission_paid
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No attributions found.
              </div>
            )}
          </div>
        );

      case "withdrawals":
        return (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {withdrawalsLoading && (
                <div className="p-6 text-center text-gray-500">
                  Loading withdrawals...
                </div>
              )}
              {withdrawalsError && (
                <div className="p-6 text-center text-red-500">
                  Error: {(withdrawalsError as Error).message}
                </div>
              )}
              {withdrawals && withdrawals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(withdrawal.amount_minor)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                                withdrawal.status
                              )}`}
                            >
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(withdrawal.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No withdrawals found.
                </div>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        theme="light"
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Affiliate Dashboard
          </h1>
          <p className="text-gray-600">
            Track your earnings, manage withdrawals, and view your performance.
          </p>
        </div>

        {affiliateLoading ? (
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 mb-8 text-center text-gray-500">
            Checking affiliate status...
          </div>
        ) : affiliateData ? (
          <div className="bg-green-50 shadow-sm rounded-xl border border-green-200 p-6 mb-8">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">✅</span>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-green-900 mb-2">
                  You're an Affiliate
                </h2>
                <p className="text-green-700">
                  Your affiliate account is active! Share your referral links
                  and track commissions below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 shadow-sm rounded-xl border border-red-200 p-6 mb-8">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-red-900 mb-2">
                  Not an Affiliate
                </h2>
                <p className="text-red-700">
                  You are not currently enrolled in the affiliate program.
                </p>
              </div>
            </div>
          </div>
        )}

        {affiliateData && (
          <>
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 mb-6 overflow-hidden">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="mr-2 text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-6">{renderTabContent()}</div>
          </>
        )}

        {summaryError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Error loading data: {(summaryError as Error).message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboard;
