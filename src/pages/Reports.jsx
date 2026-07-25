import { useState, useEffect } from "react";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { paymentMethodLabels } from "../lib/labels";
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

const methodLabel = paymentMethodLabels;

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
  const today = toLocalDateStr(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("today");

  const fetchReport = async (fromDate, toDate, pages = {}) => {
    const isPaginating = Object.keys(pages).length > 0;
    if (!isPaginating) setLoading(true);
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        order_page: pages.order_page ?? 1,
        payment_page: pages.payment_page ?? 1,
        customer_page: pages.customer_page ?? 1,
        daily_page: pages.daily_page ?? 1,
      });
      const res = await api.get(`/reports/daily?${params}`);
      setData(res.data);
    } catch {
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  // Auto-load today on mount
  useEffect(() => {
    fetchReport(from, to);
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport(from, to);
  };

  // Quick filter helpers
  const setQuickFilter = (type) => {
    setActiveFilter(type);
    const now = new Date();
    let f, t;
    if (type === "today") {
      f = t = today;
    } else if (type === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      f = toLocalDateStr(start);
      t = today;
    } else if (type === "month") {
      f = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
      t = today;
    }
    setFrom(f);
    setTo(t);
    fetchReport(f, t);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">التقارير</h2>
        <button
          onClick={() => {
            const url = `/reports/print?from=${from}&to=${to}`;
            window.open(url, "_blank");
          }}
          disabled={!data || data.summary.order_count === 0}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          🖨️ طباعة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-gray-400 mb-1">من</label>
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
            <label className="block text-xs text-gray-400 mb-1">إلى</label>
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
            عرض التقرير
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
                  ? "اليوم"
                  : type === "week"
                    ? "آخر 7 أيام"
                    : "الشهر ده"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              {
                label: "إجمالي الإيرادات",
                value: data.summary.total_revenue,
                color: "text-white",
              },
              {
                label: "إجمالي المحصل",
                value: data.summary.total_collected,
                color: "text-green-400",
              },
              {
                label: "المستحقات",
                value: data.summary.outstanding,
                color: "text-red-400",
              },
              {
                label: "إجمالي الربح",
                value: data.summary.gross_profit,
                color: "text-blue-400",
              },
              {
                label: "الطلبات",
                value: data.summary.order_count,
                color: "text-white",
                noEgp: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.noEgp ? stat.value : `${stat.value} ج.م`}
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
                  الإيرادات باليوم
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.daily_breakdown.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                        })
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
                      itemStyle={{ color: "#60a5fa" }}
                      formatter={(value) => [`${value} ج.م`, "الإيرادات"]}
                      labelFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-GB")
                      }
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
                  أكتر المنتجات مبيعاً
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
                      formatter={(value) => [`${value}`, "الكمية المُباعة"]}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Profit by Order */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">
                  الربح لكل طلب
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {[
                      "الفاتورة",
                      "العميل",
                      "الإيرادات",
                      "التكلفة",
                      "الربح",
                      "الهامش",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {h}
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
                        {o.revenue} ج.م
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-sm">
                        {o.cost} ج.م
                      </td>
                      <td className="px-4 py-2 text-green-400 text-sm font-semibold">
                        {o.profit} ج.م
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
                  مفيش طلبات
                </div>
              )}
              {data.profit_by_order.last_page > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                  <button
                    onClick={() =>
                      fetchReport(from, to, {
                        order_page: data.profit_by_order.current_page - 1,
                      })
                    }
                    disabled={data.profit_by_order.current_page === 1}
                    className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    → السابق
                  </button>
                  <span className="text-gray-500 text-xs">
                    صفحة {data.profit_by_order.current_page} من{" "}
                    {data.profit_by_order.last_page}
                  </span>
                  <button
                    onClick={() =>
                      fetchReport(from, to, {
                        order_page: data.profit_by_order.current_page + 1,
                      })
                    }
                    disabled={
                      data.profit_by_order.current_page ===
                      data.profit_by_order.last_page
                    }
                    className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    التالي ←
                  </button>
                </div>
              )}
            </div>

            {/* Orders by Customer */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">
                  الطلبات لكل عميل
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {["العميل", "الطلبات", "الإجمالي", "المحصل"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {h}
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
                        {c.total} ج.م
                      </td>
                      <td className="px-4 py-2 text-green-400 text-sm">
                        {c.collected} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.orders_by_customer.data.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  مفيش طلبات
                </div>
              )}
              {data.orders_by_customer.last_page > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                  <button
                    onClick={() =>
                      fetchReport(from, to, {
                        customer_page: data.orders_by_customer.current_page - 1,
                      })
                    }
                    disabled={data.orders_by_customer.current_page === 1}
                    className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                  >
                    → السابق
                  </button>
                  <span className="text-gray-500 text-xs">
                    صفحة {data.orders_by_customer.current_page} من{" "}
                    {data.orders_by_customer.last_page}
                  </span>
                  <button
                    onClick={() =>
                      fetchReport(from, to, {
                        customer_page: data.orders_by_customer.current_page + 1,
                      })
                    }
                    disabled={
                      data.orders_by_customer.current_page ===
                      data.orders_by_customer.last_page
                    }
                    className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                  >
                    التالي ←
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Payments History */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">
                سجل الدفعات
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  {["الفاتورة", "العميل", "المبلغ", "طريقة الدفع", "الوقت"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {h}
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
                      {p.amount} ج.م
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${methodColors[p.method] ?? "bg-gray-700 text-gray-300"}`}
                      >
                        {methodLabel[p.method] ?? p.method}
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
                مفيش دفعات.
              </div>
            )}
            {data.payments_history.last_page > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                <button
                  onClick={() =>
                    fetchReport(from, to, {
                      payment_page: data.payments_history.current_page - 1,
                    })
                  }
                  disabled={data.payments_history.current_page === 1}
                  className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  → السابق
                </button>
                <span className="text-gray-500 text-xs">
                  صفحة {data.payments_history.current_page} من{" "}
                  {data.payments_history.last_page}
                </span>
                <button
                  onClick={() =>
                    fetchReport(from, to, {
                      payment_page: data.payments_history.current_page + 1,
                    })
                  }
                  disabled={
                    data.payments_history.current_page ===
                    data.payments_history.last_page
                  }
                  className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  التالي ←
                </button>
              </div>
            )}
          </div>

          {/* Daily Breakdown — only show for date ranges */}
          {data.daily_breakdown.total > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">
                  التفصيل اليومي
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {["التاريخ", "الطلبات", "الإيرادات"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {h}
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
                        {new Date(day.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {day.orders}
                      </td>
                      <td className="px-4 py-3 text-white text-sm font-semibold">
                        {day.revenue} ج.م
                      </td>
                    </tr>
                  ))}
                  {data.daily_breakdown.last_page > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                      <button
                        onClick={() =>
                          fetchReport(from, to, {
                            daily_page: data.daily_breakdown.current_page - 1,
                          })
                        }
                        disabled={data.daily_breakdown.current_page === 1}
                        className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                      >
                        → السابق
                      </button>
                      <span className="text-gray-500 text-xs">
                        صفحة {data.daily_breakdown.current_page} من{" "}
                        {data.daily_breakdown.last_page}
                      </span>
                      <button
                        onClick={() =>
                          fetchReport(from, to, {
                            daily_page: data.daily_breakdown.current_page + 1,
                          })
                        }
                        disabled={
                          data.daily_breakdown.current_page ===
                          data.daily_breakdown.last_page
                        }
                        className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-50 hover:bg-gray-700"
                      >
                        التالي ←
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
