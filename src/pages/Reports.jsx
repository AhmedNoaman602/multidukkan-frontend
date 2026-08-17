import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../hooks/useToast";
import { useTranslation } from "../i18n/useTranslation";
import { formatCurrency, formatDate } from "../lib/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const methodColors = {
  cash: "bg-green-500/20 text-green-400",
  bank_transfer: "bg-blue-500/20 text-blue-400",
  instapay: "bg-purple-500/20 text-purple-400",
  vodafone_cash: "bg-red-500/20 text-red-400",
  orange_cash: "bg-orange-500/20 text-orange-400",
  check: "bg-yellow-500/20 text-yellow-400",
};

const toLocalDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function Reports() {
  const { t, lang, dir } = useTranslation();
  const { showToast } = useToast();
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const today = toLocalDateStr(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [activeFilter, setActiveFilter] = useState("today");
  const [queryParams, setQueryParams] = useState({
    from: today, to: today, orderPage: 1, paymentPage: 1, customerPage: 1, dailyPage: 1,
  });

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: ['reports', 'daily', queryParams],
    queryFn: () => api.get('/reports/daily', {
      params: {
        from: queryParams.from,
        to: queryParams.to,
        order_page: queryParams.orderPage,
        payment_page: queryParams.paymentPage,
        customer_page: queryParams.customerPage,
        daily_page: queryParams.dailyPage,
      },
    }).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isError) showToast(t('reports.print.loadFailed'), 'error');
  }, [isError, showToast, t]);

  const setReportPage = (key, page) => setQueryParams(p => ({ ...p, [key]: page }));

  const handleFilter = (e) => {
    e.preventDefault();
    setQueryParams({ from, to, orderPage: 1, paymentPage: 1, customerPage: 1, dailyPage: 1 });
  };

  // Quick filter helpers
  const setQuickFilter = (type) => {
    setActiveFilter(type);
    const now = new Date();
    let f, toDate;
    if (type === "today") {
      f = toDate = today;
    } else if (type === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      f = toLocalDateStr(start);
      toDate = today;
    } else if (type === "month") {
      f = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
      toDate = today;
    }
    setFrom(f);
    setTo(toDate);
    setQueryParams({ from: f, to: toDate, orderPage: 1, paymentPage: 1, customerPage: 1, dailyPage: 1 });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{t('reports.title')}</h2>
        <button
          onClick={() => {
            const url = `/reports/print?from=${from}&to=${to}`;
            window.open(url, "_blank");
          }}
          disabled={!data || data.summary.order_count === 0}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          {t('reports.printButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('common.from')}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setActiveFilter(null);
              }}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('common.to')}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setActiveFilter(null);
              }}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t('reports.viewReport')}
          </button>
          <div className="flex gap-2 ms-auto">
            {["today", "week", "month"].map((type) => (
              <button
                key={type}
                onClick={() => setQuickFilter(type)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors capitalize ${
                  activeFilter === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {type === "today"
                  ? t('orders.list.filterModes.today')
                  : type === "week"
                    ? t('reports.last7Days')
                    : t('reports.thisMonth')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            {[
              {
                label: t('orders.list.totalRevenue'),
                value: formatCurrency(data.summary.total_revenue, lang),
                color: "text-white",
              },
              {
                label: t('reports.print.totalCollected'),
                value: formatCurrency(data.summary.total_collected, lang),
                color: "text-green-400",
              },
              {
                label: t('reports.print.outstanding'),
                value: formatCurrency(data.summary.outstanding, lang),
                color: "text-red-400",
              },
              {
                label: t('orders.detail.totalProfit'),
                value: formatCurrency(data.summary.gross_profit, lang),
                color: "text-blue-400",
              },
              {
                label: t('reports.print.ordersCount'),
                value: data.summary.order_count,
                color: "text-white",
              },
              {
                label: t('reports.print.totalExpenses'),
                value: formatCurrency(data.summary.total_expenses, lang),
                color: "text-yellow-400",
              },
              {
                label: t('reports.print.netProfit'),
                value: formatCurrency(data.summary.net_profit, lang),
                color: data.summary.net_profit < 0 ? "text-red-400" : "text-green-400",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          {/* Charts */}
          {data.daily_breakdown.total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Revenue by Day */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-4">
                  {t('reports.revenueByDay')}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.daily_breakdown.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={(d) => formatDate(d, lang, { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#60a5fa" }}
                      formatter={(value) => [formatCurrency(value, lang), t('orders.detail.revenue')]}
                      labelFormatter={(d) => formatDate(d, lang)}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products by Units Sold */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-4">
                  {t('reports.topProductsSold')}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.products_sold.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="product_name"
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      tickFormatter={(name) =>
                        name.length > 10 ? name.substring(0, 10) + "..." : name
                      }
                    />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#10b981" }}
                      formatter={(value) => [`${value}`, t('reports.unitsSold')]}
                    />
                    <Bar
                      dataKey="units_sold"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expenses by Category */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">
                {t('reports.print.expensesByCategory')}
              </h3>
            </div>
            {data.expenses_by_category.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {['reports.print.category', 'common.amount'].map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.expenses_by_category.map((item) => (
                    <tr key={item.category} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-2 text-white text-sm">
                        {t(`enums.expenseCategory.${item.category}`)}
                      </td>
                      <td className="px-4 py-2 text-white text-sm">
                        {formatCurrency(item.total, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                {t('reports.noExpenses')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Profit by Order */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">
                  {t('reports.print.profitByOrder')}
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {[
                      'common.invoice',
                      'common.customer',
                      'orders.detail.revenue',
                      'orders.detail.cost',
                      'reports.print.profit',
                      'reports.print.margin',
                    ].map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.profit_by_order.data.map((o, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-400 text-sm font-mono">
                        {o.invoice_number}
                      </td>
                      <td className="px-4 py-2 text-white text-sm">
                        {o.customer_name}
                      </td>
                      <td className="px-4 py-2 text-white text-sm">
                        {formatCurrency(o.revenue, lang)}
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-sm">
                        {formatCurrency(o.cost, lang)}
                      </td>
                      <td className="px-4 py-2 text-green-400 text-sm font-semibold">
                        {formatCurrency(o.profit, lang)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            o.margin >= 30
                              ? "bg-green-500/20 text-green-400"
                              : o.margin >= 10
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {o.margin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.profit_by_order.data.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t('reports.noOrders')}
                </div>
              )}
              {data.profit_by_order.last_page > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                  <button
                    onClick={() =>
                      setReportPage('orderPage', data.profit_by_order.current_page - 1)
                    }
                    disabled={data.profit_by_order.current_page === 1}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    <PrevIcon size={14} />
                    {t('common.previous')}
                  </button>
                  <span className="text-gray-500 text-xs">
                    {t('common.pageOf', { page: data.profit_by_order.current_page, total: data.profit_by_order.last_page })}
                  </span>
                  <button
                    onClick={() =>
                      setReportPage('orderPage', data.profit_by_order.current_page + 1)
                    }
                    disabled={
                      data.profit_by_order.current_page ===
                      data.profit_by_order.last_page
                    }
                    className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    {t('common.next')}
                    <NextIcon size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Orders by Customer */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">
                  {t('reports.print.ordersByCustomer')}
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {['common.customer', 'reports.print.ordersCount', 'common.total', 'reports.print.collected'].map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.orders_by_customer.data.map((c, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-white text-sm font-medium">
                        {c.customer_name}
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-sm">
                        {c.orders_count}
                      </td>
                      <td className="px-4 py-2 text-white text-sm">
                        {formatCurrency(c.total, lang)}
                      </td>
                      <td className="px-4 py-2 text-green-400 text-sm">
                        {formatCurrency(c.collected, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.orders_by_customer.data.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t('reports.noOrders')}
                </div>
              )}
              {data.orders_by_customer.last_page > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                  <button
                    onClick={() =>
                      setReportPage('customerPage', data.orders_by_customer.current_page - 1)
                    }
                    disabled={data.orders_by_customer.current_page === 1}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                  >
                    <PrevIcon size={14} />
                    {t('common.previous')}
                  </button>
                  <span className="text-gray-500 text-xs">
                    {t('common.pageOf', { page: data.orders_by_customer.current_page, total: data.orders_by_customer.last_page })}
                  </span>
                  <button
                    onClick={() =>
                      setReportPage('customerPage', data.orders_by_customer.current_page + 1)
                    }
                    disabled={
                      data.orders_by_customer.current_page ===
                      data.orders_by_customer.last_page
                    }
                    className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                  >
                    {t('common.next')}
                    <NextIcon size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Payments History */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">
                {t('reports.print.paymentsHistory')}
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  {['common.invoice', 'common.customer', 'common.amount', 'orders.payModal.method', 'common.time'].map(
                    (key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {t(key)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.payments_history.data.map((p, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-400 text-sm font-mono">
                      {p.invoice_number}
                    </td>
                    <td className="px-4 py-2 text-white text-sm">
                      {p.customer_name}
                    </td>
                    <td className="px-4 py-2 text-green-400 text-sm font-semibold">
                      {formatCurrency(p.amount, lang)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${methodColors[p.method] ?? "bg-gray-700 text-gray-300"}`}
                      >
                        {t(`enums.paymentMethod.${p.method}`)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-sm">
                      {new Date(p.paid_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Cairo",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.payments_history.data.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                {t('reports.noPayments')}
              </div>
            )}
            {data.payments_history.last_page > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                <button
                  onClick={() =>
                    setReportPage('paymentPage', data.payments_history.current_page - 1)
                  }
                  disabled={data.payments_history.current_page === 1}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  <PrevIcon size={14} />
                  {t('common.previous')}
                </button>
                <span className="text-gray-500 text-xs">
                  {t('common.pageOf', { page: data.payments_history.current_page, total: data.payments_history.last_page })}
                </span>
                <button
                  onClick={() =>
                    setReportPage('paymentPage', data.payments_history.current_page + 1)
                  }
                  disabled={
                    data.payments_history.current_page ===
                    data.payments_history.last_page
                  }
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  {t('common.next')}
                  <NextIcon size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Daily Breakdown — only show for date ranges */}
          {data.daily_breakdown.total > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">
                  {t('reports.print.dailyBreakdown')}
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {['common.date', 'reports.print.ordersCount', 'orders.detail.revenue'].map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {t(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {data.daily_breakdown.data.map((day, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {formatDate(day.date, lang)}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {day.orders}
                      </td>
                      <td className="px-4 py-3 text-white text-sm font-semibold">
                        {formatCurrency(day.revenue, lang)}
                      </td>
                    </tr>
                  ))}
                  {data.daily_breakdown.last_page > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                      <button
                        onClick={() =>
                          setReportPage('dailyPage', data.daily_breakdown.current_page - 1)
                        }
                        disabled={data.daily_breakdown.current_page === 1}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                      >
                        <PrevIcon size={14} />
                        {t('common.previous')}
                      </button>
                      <span className="text-gray-500 text-xs">
                        {t('common.pageOf', { page: data.daily_breakdown.current_page, total: data.daily_breakdown.last_page })}
                      </span>
                      <button
                        onClick={() =>
                          setReportPage('dailyPage', data.daily_breakdown.current_page + 1)
                        }
                        disabled={
                          data.daily_breakdown.current_page ===
                          data.daily_breakdown.last_page
                        }
                        className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                      >
                        {t('common.next')}
                        <NextIcon size={14} />
                      </button>
                    </div>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
