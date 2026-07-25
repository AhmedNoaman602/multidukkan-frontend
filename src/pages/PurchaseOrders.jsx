import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchInput from "../components/SearchInput";
import Modal from "../components/Modal";
import StatBoxes from "../components/StatBoxes";
import { useToast } from "../hooks/useToast";

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "cash" });
  const [paying, setPaying] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [years, setYears] = useState([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateExact, setDateExact] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [stats, setStats] = useState(null);
  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const hasActiveFilters =
    yearFilter || monthFilter || dateFrom || dateTo || dateExact || search || filterMode !== 'all';

  const clearFilters = () => {
    setFilterMode("all");
    setYearFilter("");
    setMonthFilter("");
    setDateFrom("");
    setDateTo("");
    setDateExact("");
    setSearch("");
    setPage(1);
  };

  const fetchPurchaseOrders = () => {
    const today = new Date().toISOString().split("T")[0];

    api.get("/purchase-orders", {
        params: {
          page,
          search,
          year: yearFilter,
          month: monthFilter,
          date_from: dateFrom,
          date_to: dateTo,
          date_exact: filterMode === "today" ? today : dateExact,
        },
      })
      .then((res) => {
        setPurchaseOrders(res.data.data);
        setLastPage(res.data.meta.last_page);
        setYears(res.data.years);
        setStats(res.data.stats || null);
      })
      .catch(() => showToast("حصلت مشكلة في تحميل أوامر الشراء", "error"))
      .finally(() => {
        setLoading(false)
      });
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [
    page,
    search,
    yearFilter,
    monthFilter,
    dateFrom,
    dateTo,
    dateExact,
    filterMode,
  ]);

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await api.post("/supplier-payments", {
        supplier_id: payTarget.supplier_id,
        purchase_order_id: payTarget.id,
        amount: parseFloat(payForm.amount),
        method: payForm.method,
      });
      showToast("تم تسجيل الدفع بنجاح!", "success");
      setTimeout(() => {
        setPayTarget(null);
        setPayForm({ amount: "", method: "cash" });
        fetchPurchaseOrders();
      }, 1500);
    } catch (err) {
      showToast(
        err.response?.data?.message || "حصلت مشكلة في تنفيذ الدفع",
        "error",
      );
    } finally {
      setPaying(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const getPaidAmount = (order) => {
    if (order.amount_paid != null) return Number(order.amount_paid) || 0;
    const total = Number(order.total) || 0;
    const remaining = Number(order.amount_remaining) || 0;
    return Math.max(total - remaining, 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6 space-y-4">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">أوامر الشراء</h2>
          <button
            onClick={() => navigate("/purchase-orders/create")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + أمر شراء جديد
          </button>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث بالمورد أو رقم الفاتورة..."
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 text-xs uppercase tracking-wider">
              تصفية:
            </span>
            {[
              { label: "كل الفترات", value: "all" },
              { label: "اليوم", value: "today" },
              { label: "الشهر", value: "month" },
              { label: "السنة", value: "year" },
              { label: "فترة", value: "range" },
              { label: "تاريخ محدد", value: "exact" },
            ].map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  setFilterMode(mode.value);
                  setYearFilter("");
                  setMonthFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setDateExact("");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterMode === mode.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {filterMode === "year" && (
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">اختر السنة</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {filterMode === "month" && (
            <div className="flex items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">اختر السنة</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">اختر الشهر</option>
                {[
                  "يناير",
                  "فبراير",
                  "مارس",
                  "أبريل",
                  "مايو",
                  "يونيو",
                  "يوليو",
                  "أغسطس",
                  "سبتمبر",
                  "أكتوبر",
                  "نوفمبر",
                  "ديسمبر",
                ].map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === "range" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">من</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">إلى</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {filterMode === "exact" && (
            <input
              type="date"
              value={dateExact}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setDateExact(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs transition-colors"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>
      {stats && (
        <StatBoxes
          stats={[
            {
              label: "إجمالي الأوامر",
              value: stats.total_orders,
              color: "white",
            },
            {
              label: "إجمالي المصروف",
              value: `${stats.total_spent} ج.م`,
              color: "white",
            },
            {
              label: "المدفوع",
              value: `${stats.paid_amount} ج.م`,
              color: "green",
            },
            {
              label: "غير المدفوع",
              value: `${stats.unpaid_amount} ج.م`,
              color: "red",
            },
          ]}
        />
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              {[
                "الفاتورة",
                "المورد",
                "الأصناف",
                "الإجمالي",
                "الحالة",
                "التاريخ",
                "إجراءات",
              ].map((h) => (
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
            {purchaseOrders.map((order) => (
              <tr
                key={order.id}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const placement = rect.top > 180 ? "above" : "below";
                  setTooltipPos({
                    top: placement === "above" ? rect.top : rect.bottom,
                    left: rect.left + rect.width / 2,
                    placement,
                  });
                  setHoveredOrder(order.id);
                }}
                onMouseLeave={() => setHoveredOrder(null)}
                onClick={() => navigate(`/purchase-orders/${order.id}`)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                  {order.invoice_number || `#${order.id}`}
                </td>
                <td className="px-4 py-3 text-white text-sm font-medium">
                  {order.supplier_name}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  الأصناف: {order.items_count}
                </td>
                <td className="px-4 py-3 text-white text-sm">
                  {order.total} ج.م
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === "paid"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `/purchase-orders/${order.id}/invoice`,
                          "_blank",
                        );
                      }}
                      className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      فاتورة
                    </button>
                    {order.status === "unpaid" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayTarget(order);
                          setPayForm({
                            amount: order.amount_remaining,
                            method: "cash",
                          });
                        }}
                        className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-lg hover:bg-purple-500/20 transition-colors"
                      >
                        دفع
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {purchaseOrders.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            {hasActiveFilters
              ? "مفيش أوامر مطابقة للتصفية."
              : "مفيش أوامر شراء لسه."}
          </div>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            → السابق
          </button>
          <span className="text-gray-400 text-sm">
            صفحة {page} من {lastPage}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === lastPage}
            className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
          >
            التالي ←
          </button>
        </div>
      )}

      <Modal
        open={!!payTarget}
        onClose={() => {
          setPayTarget(null);
          setPayForm({ amount: "", method: "cash" });
        }}
        title={`Pay — ${payTarget?.invoice_number}`}
      >
        {payTarget && (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">المبلغ</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({ ...payForm, amount: e.target.value })
                }
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">طريقة الدفع</label>
              <select
                value={payForm.method}
                onChange={(e) =>
                  setPayForm({ ...payForm, method: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={paying || !payForm.amount}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {paying ? "جاري التنفيذ..." : "تأكيد الدفع"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {hoveredOrder &&
        tooltipPos &&
        createPortal(
          (() => {
            const order = purchaseOrders.find((o) => o.id === hoveredOrder);
            if (!order) return null;
            return (
              <div
                className="fixed pointer-events-none z-50"
                style={{
                  top: tooltipPos.top,
                  left: tooltipPos.left,
                  transform: `translate(-50%, ${tooltipPos.placement === "above" ? "calc(-100% - 8px)" : "8px"})`,
                }}
              >
                <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl px-4 py-3 w-60">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">الإجمالي:</span>
                      <span className="text-white font-medium">
                        {order.total} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">المدفوع:</span>
                      <span className="text-green-400 font-medium">
                        {getPaidAmount(order)} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                      <span className="text-gray-400">المتبقي:</span>
                      <span className="text-red-400 font-medium">
                        {order.amount_remaining || 0} ج.م
                      </span>
                    </div>
                    {order.payments_count > 0 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        الدفعات: {order.payments_count}
                      </div>
                    )}
                  </div>

                  {tooltipPos.placement === "above" ? (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                border-l-[6px] border-l-transparent
                                border-r-[6px] border-r-transparent
                                border-t-[6px] border-t-gray-800"
                    ></div>
                  ) : (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0
                                border-l-[6px] border-l-transparent
                                border-r-[6px] border-r-transparent
                                border-b-[6px] border-b-gray-800"
                    ></div>
                  )}
                </div>
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
}
