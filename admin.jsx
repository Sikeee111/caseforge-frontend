import React, { useEffect, useMemo, useState } from "react";

const API = "http://localhost:4000";

const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

const RARITIES = [
  "Common",
  "Rare",
  "Epic",
  "Legendary",
  "Secret",
];

const rarityClass = (rarity) =>
  String(rarity || "Common").toLowerCase();

const money = (cents) =>
  `$${(Number(cents || 0) / 100).toFixed(2)}`;

const rarityIcon = (rarity) =>
  rarity === "Secret"
    ? "☄"
    : rarity === "Legendary"
    ? "👑"
    : rarity === "Epic"
    ? "◆"
    : "◇";

function RewardThumbnail({ item }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.image_url]);

  if (!item.image_url || imageFailed) {
    return (
      <div
        className="admin-reward-icon"
        style={{
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {rarityIcon(item.rarity)}
      </div>
    );
  }

  return (
    <div
      className="admin-reward-icon"
      style={{
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={item.image_url}
        alt={item.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function Admin() {
  const [cases, setCases] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseItems, setCaseItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [adminView, setAdminView] = useState("activity");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersSearch, setAdminUsersSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [adminOpenings, setAdminOpenings] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminActivityTab, setAdminActivityTab] = useState("openings");
  const [adminActivitySearch, setAdminActivitySearch] = useState("");
  const [adminAccess, setAdminAccess] = useState(null);
  const [adminAccessLoading, setAdminAccessLoading] = useState(true);
  const [adminBootstrapLoading, setAdminBootstrapLoading] = useState(false);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminPaymentsLoading, setAdminPaymentsLoading] = useState(false);
  const [adminPaymentStatus, setAdminPaymentStatus] = useState("pending");
  const [adminPaymentSearch, setAdminPaymentSearch] = useState("");
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminLogsLoading, setAdminLogsLoading] = useState(false);
  const [adminLogSearch, setAdminLogSearch] = useState("");
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [balanceAdjustmentMode, setBalanceAdjustmentMode] = useState("add");
  const [balanceAdjusting, setBalanceAdjusting] = useState(false);
  const [adminRoleUpdating, setAdminRoleUpdating] = useState(false);
  const [adminInventory, setAdminInventory] = useState([]);
  const [adminInventoryHistory, setAdminInventoryHistory] = useState([]);
  const [adminInventoryLoading, setAdminInventoryLoading] = useState(false);
  const [adminInventoryHistoryLoading, setAdminInventoryHistoryLoading] = useState(false);
  const [adminInventoryTab, setAdminInventoryTab] = useState("inventory");
  const [adminInventoryItemId, setAdminInventoryItemId] = useState("");
  const [adminInventoryNote, setAdminInventoryNote] = useState("");
  const [adminInventoryGranting, setAdminInventoryGranting] = useState(false);
  const [adminInventoryRemovingId, setAdminInventoryRemovingId] = useState(null);
  const [adminInventorySearch, setAdminInventorySearch] = useState("");
  const [adminInventoryRarity, setAdminInventoryRarity] = useState("all");
  const [adminInventoryHistorySearch, setAdminInventoryHistorySearch] = useState("");
  const [adminInventoryHistoryAction, setAdminInventoryHistoryAction] = useState("all");
  const [adminInventoryHistoryRarity, setAdminInventoryHistoryRarity] = useState("all");
  const [selectedInventoryIds, setSelectedInventoryIds] = useState(() => new Set());
  const [adminInventoryBulkWorking, setAdminInventoryBulkWorking] = useState(false);
  const [adminInventoryBulkModalOpen, setAdminInventoryBulkModalOpen] = useState(false);

  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);

  const [newCase, setNewCase] = useState({
    name: "",
    price: "",
  });

  const [newItem, setNewItem] = useState({
    name: "",
    rarity: "Common",
    value: "",
    imageUrl: "",
  });

  const [rewardForm, setRewardForm] = useState({
    itemId: "",
    probability: "",
  });

  const [editingCase, setEditingCase] = useState({
    name: "",
    price: "",
  });

  const [caseSearch, setCaseSearch] = useState("");
  const [rewardSearch, setRewardSearch] = useState("");
  const [showCasePreview, setShowCasePreview] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load cases
  |--------------------------------------------------------------------------
  */

  const loadCases = async () => {
    const response = await apiFetch(`${API}/api/admin/cases`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load cases"
      );
    }

    setCases(data.cases || []);
  };

  /*
  |--------------------------------------------------------------------------
  | Load items
  |--------------------------------------------------------------------------
  */

  const loadItems = async () => {
    const response = await apiFetch(`${API}/api/admin/items`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load items"
      );
    }

    setItems(data.items || []);
  };

  /*
  |--------------------------------------------------------------------------
  | Load selected case
  |--------------------------------------------------------------------------
  */

  const loadCase = async (caseId) => {
    if (!caseId) return;

    setCaseLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/cases/${caseId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load case"
        );
      }

      setSelectedCase(data.case);
      setCaseItems(data.items || []);

      setEditingCase({
        name: data.case.name || "",
        price: (
          Number(data.case.price_cents || 0) / 100
        ).toFixed(2),
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCaseLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await apiFetch(`${API}/api/admin/analytics`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load analytics");
      }

      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadAdminUsers = async (search = adminUsersSearch) => {
    setAdminUsersLoading(true);
    try {
      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";
      const response = await apiFetch(`${API}/api/admin/users${query}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load users");
      }
      setAdminUsers(data.users || []);
      if (selectedUserId && !(data.users || []).some((u) => Number(u.id) === Number(selectedUserId))) {
        setSelectedUserId(null);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const loadAdminActivity = async (search = adminActivitySearch) => {
    try {
      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";
      const [openingsResponse, transactionsResponse] = await Promise.all([
        apiFetch(`${API}/api/admin/openings${query}`),
        apiFetch(`${API}/api/admin/transactions${query}`),
      ]);
      const openingsData = await openingsResponse.json();
      const transactionsData = await transactionsResponse.json();
      if (!openingsResponse.ok) {
        throw new Error(openingsData.error || "Failed to load openings");
      }
      if (!transactionsResponse.ok) {
        throw new Error(transactionsData.error || "Failed to load transactions");
      }
      setAdminOpenings(openingsData.openings || []);
      setAdminTransactions(transactionsData.transactions || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const loadSelectedUser = async (userId) => {
    if (!userId) return;
    setSelectedUserId(Number(userId));
    setSelectedUserLoading(true);
    try {
      const response = await apiFetch(`${API}/api/admin/users/${userId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load user");
      }
      setSelectedUser(data.user);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSelectedUserLoading(false);
    }
  };

  const loadAdminInventory = async (userId = selectedUserId) => {
    if (!userId) {
      setAdminInventory([]);
      return;
    }

    setAdminInventoryLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/users/${userId}/inventory`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load inventory"
        );
      }

      setAdminInventory(data.inventory || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminInventoryLoading(false);
    }
  };

  const loadAdminInventoryHistory = async (userId = selectedUserId) => {
    if (!userId) {
      setAdminInventoryHistory([]);
      return;
    }

    setAdminInventoryHistoryLoading(true);

    try {
      const response = await apiFetch(
        `${API}/api/admin/users/${userId}/inventory/history`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load inventory history"
        );
      }

      setAdminInventoryHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminInventoryHistoryLoading(false);
    }
  };

  const filteredAdminInventory = useMemo(() => {
    const query = adminInventorySearch.trim().toLowerCase();

    return adminInventory.filter((item) => {
      const matchesSearch = !query ||
        String(item.name || "").toLowerCase().includes(query) ||
        String(item.item_id || "").includes(query) ||
        String(item.id || "").includes(query);

      const matchesRarity =
        adminInventoryRarity === "all" ||
        String(item.rarity || "") === adminInventoryRarity;

      return matchesSearch && matchesRarity;
    });
  }, [adminInventory, adminInventorySearch, adminInventoryRarity]);

  const filteredAdminInventoryHistory = useMemo(() => {
    const query = adminInventoryHistorySearch.trim().toLowerCase();

    return adminInventoryHistory.filter((entry) => {
      const matchesSearch = !query ||
        String(entry.name || "").toLowerCase().includes(query) ||
        String(entry.item_id || "").includes(query) ||
        String(entry.inventory_id || "").includes(query) ||
        String(entry.admin_username || "").toLowerCase().includes(query) ||
        String(entry.note || "").toLowerCase().includes(query);

      const matchesAction =
        adminInventoryHistoryAction === "all" ||
        String(entry.action || "") === adminInventoryHistoryAction;

      const matchesRarity =
        adminInventoryHistoryRarity === "all" ||
        String(entry.rarity || "") === adminInventoryHistoryRarity;

      return matchesSearch && matchesAction && matchesRarity;
    });
  }, [
    adminInventoryHistory,
    adminInventoryHistorySearch,
    adminInventoryHistoryAction,
    adminInventoryHistoryRarity,
  ]);

  const clearAdminInventoryFilters = () => {
    setAdminInventorySearch("");
    setAdminInventoryRarity("all");
  };

  const clearAdminInventoryHistoryFilters = () => {
    setAdminInventoryHistorySearch("");
    setAdminInventoryHistoryAction("all");
    setAdminInventoryHistoryRarity("all");
  };

  const selectedInventoryItems = useMemo(() => {
    return adminInventory.filter((item) =>
      selectedInventoryIds.has(Number(item.id))
    );
  }, [adminInventory, selectedInventoryIds]);

  const selectedInventoryValue = useMemo(() => {
    return selectedInventoryItems.reduce(
      (sum, item) => sum + Number(item.value_cents || 0),
      0
    );
  }, [selectedInventoryItems]);

  const allVisibleInventorySelected =
    filteredAdminInventory.length > 0 &&
    filteredAdminInventory.every((item) =>
      selectedInventoryIds.has(Number(item.id))
    );

  const toggleInventorySelection = (inventoryId) => {
    const numericId = Number(inventoryId);

    setSelectedInventoryIds((current) => {
      const next = new Set(current);

      if (next.has(numericId)) {
        next.delete(numericId);
      } else {
        next.add(numericId);
      }

      return next;
    });
  };

  const selectAllVisibleInventory = () => {
    setSelectedInventoryIds((current) => {
      const next = new Set(current);

      filteredAdminInventory.forEach((item) => {
        next.add(Number(item.id));
      });

      return next;
    });
  };

  const clearInventorySelection = () => {
    setSelectedInventoryIds(new Set());
  };

  const bulkRemoveInventoryItems = async () => {
    if (!selectedUser || selectedInventoryItems.length === 0) return;

    setAdminInventoryBulkWorking(true);
    setError("");
    setSuccess("");

    let removed = 0;
    let failed = 0;

    try {
      for (const item of selectedInventoryItems) {
        try {
          const response = await apiFetch(
            `${API}/api/admin/users/${selectedUser.id}/inventory/${item.id}`,
            {
              method: "DELETE",
              body: JSON.stringify({
                note: "Bulk removed from Admin Inventory Management",
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to remove item");
          }

          removed += 1;
        } catch (itemError) {
          console.error(
            `Bulk removal failed for inventory item ${item.id}:`,
            itemError
          );
          failed += 1;
        }
      }

      setSelectedInventoryIds(new Set());
      setAdminInventoryBulkModalOpen(false);

      await Promise.all([
        loadAdminInventory(selectedUser.id),
        loadAdminInventoryHistory(selectedUser.id),
        loadSelectedUser(selectedUser.id),
      ]);

      if (failed > 0) {
        setError(
          `${removed} item${removed === 1 ? "" : "s"} removed. ${failed} item${failed === 1 ? "" : "s"} could not be removed.`
        );
      } else {
        setSuccess(
          `${removed} item${removed === 1 ? "" : "s"} removed from ${selectedUser.username}'s inventory.`
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Bulk inventory removal failed");
    } finally {
      setAdminInventoryBulkWorking(false);
    }
  };

  const openAdminInventoryForUser = async (userId) => {
    const numericId = Number(userId);
    if (!numericId) return;

    setAdminView("inventory");
    setSelectedUserId(numericId);
    setAdminInventoryTab("inventory");
    setAdminInventorySearch("");
    setAdminInventoryRarity("all");
    setAdminInventoryHistorySearch("");
    setAdminInventoryHistoryAction("all");
    setAdminInventoryHistoryRarity("all");
    setSelectedInventoryIds(new Set());
    setAdminInventoryBulkModalOpen(false);
    setError("");

    await Promise.all([
      loadSelectedUser(numericId),
      loadAdminInventory(numericId),
      loadAdminInventoryHistory(numericId),
    ]);
  };

  const grantInventoryItem = async () => {
    if (!selectedUser || !adminInventoryItemId) return;

    setAdminInventoryGranting(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/users/${selectedUser.id}/inventory`,
        {
          method: "POST",
          body: JSON.stringify({
            itemId: Number(adminInventoryItemId),
            note: adminInventoryNote,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to grant inventory item"
        );
      }

      setAdminInventoryItemId("");
      setAdminInventoryNote("");
      setSuccess(
        `${data.inventory.name} was granted to ${selectedUser.username}.`
      );

      await Promise.all([
        loadAdminInventory(selectedUser.id),
        loadAdminInventoryHistory(selectedUser.id),
        loadSelectedUser(selectedUser.id),
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminInventoryGranting(false);
    }
  };

  const removeInventoryItem = async (inventoryId) => {
    if (!selectedUser || !inventoryId) return;

    const item = adminInventory.find(
      (entry) => Number(entry.id) === Number(inventoryId)
    );

    const confirmed = window.confirm(
      `Remove ${item?.name || "this item"} from ${selectedUser.username}'s inventory?`
    );

    if (!confirmed) return;

    setAdminInventoryRemovingId(Number(inventoryId));
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/users/${selectedUser.id}/inventory/${inventoryId}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            note: "Removed from Admin Inventory Management",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to remove inventory item"
        );
      }

      setSuccess(
        `${data.item?.name || "Item"} was removed from ${selectedUser.username}'s inventory.`
      );

      await Promise.all([
        loadAdminInventory(selectedUser.id),
        loadAdminInventoryHistory(selectedUser.id),
        loadSelectedUser(selectedUser.id),
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminInventoryRemovingId(null);
    }
  };

  const adjustUserBalance = async () => {
    if (!selectedUser) return;
    const amount = Number(balanceAdjustment);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid positive balance amount.");
      return;
    }

    const amountCents = Math.round(amount * 100);
    setBalanceAdjusting(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(
        `${API}/api/admin/users/${selectedUser.id}/balance`,
        {
          method: "PATCH",
          body: JSON.stringify({
            amountCents,
            mode: balanceAdjustmentMode,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to adjust balance");
      }
      setSelectedUser((current) => ({
        ...current,
        balance_cents: data.balanceCents,
      }));
      setAdminUsers((current) =>
        current.map((user) =>
          Number(user.id) === Number(selectedUser.id)
            ? { ...user, balance_cents: data.balanceCents }
            : user
        )
      );
      setBalanceAdjustment("");
      setSuccess(`Balance updated for ${selectedUser.username}.`);
      await loadAdminActivity();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setBalanceAdjusting(false);
    }
  };


  const updateAdminRole = async () => {
    if (!selectedUser) return;

    const makeAdmin = !selectedUser.is_admin;
    const action = makeAdmin ? "promote" : "remove admin access";

    if (!window.confirm(`Are you sure you want to ${action} for ${selectedUser.username}?`)) {
      return;
    }

    setAdminRoleUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/users/${selectedUser.id}/admin`,
        {
          method: "PATCH",
          body: JSON.stringify({ isAdmin: makeAdmin }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update admin access");
      }

      setSelectedUser((current) => ({
        ...current,
        is_admin: data.isAdmin,
      }));

      setAdminUsers((current) =>
        current.map((user) =>
          Number(user.id) === Number(selectedUser.id)
            ? { ...user, is_admin: data.isAdmin }
            : user
        )
      );

      setSuccess(
        data.isAdmin
          ? `${selectedUser.username} is now an Administrator.`
          : `Administrator access removed from ${selectedUser.username}.`
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminRoleUpdating(false);
    }
  };

  const loadAdminAccess = async () => {
    setAdminAccessLoading(true);
    try {
      const response = await apiFetch(`${API}/api/admin/access`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check admin access");
      }

      if (data.needsBootstrap) {
        setAdminBootstrapLoading(true);
        const bootstrapResponse = await apiFetch(`${API}/api/admin/bootstrap`, {
          method: "POST",
        });
        const bootstrapData = await bootstrapResponse.json();

        if (!bootstrapResponse.ok) {
          throw new Error(
            bootstrapData.error || "Failed to bootstrap admin access"
          );
        }

        const refreshed = await apiFetch(`${API}/api/admin/access`);
        const refreshedData = await refreshed.json();
        setAdminAccess(refreshedData);
      } else {
        setAdminAccess(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setAdminAccess({ authenticated: false, isAdmin: false, needsBootstrap: false });
    } finally {
      setAdminBootstrapLoading(false);
      setAdminAccessLoading(false);
    }
  };

  const bootstrapAdmin = async () => {
    setAdminBootstrapLoading(true);
    setError("");
    try {
      const response = await apiFetch(`${API}/api/admin/bootstrap`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to enable admin access");
      }
      await loadAdminAccess();
      setSuccess(data.message || "Admin access enabled.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminBootstrapLoading(false);
    }
  };

  const loadAdminPayments = async (
    status = adminPaymentStatus,
    search = adminPaymentSearch
  ) => {
    setAdminPaymentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await apiFetch(`${API}/api/admin/payments${query}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load payment requests");
      }
      setAdminPayments(data.payments || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminPaymentsLoading(false);
    }
  };

  const reviewPayment = async (paymentId, action) => {
    if (!paymentId) return;
    const label = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this payment request?`)) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await apiFetch(`${API}/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Payment review failed");
      }
      setSuccess(`Payment #${paymentId} ${data.status}.`);
      await Promise.all([
        loadAdminPayments(),
        loadAdminActivity(),
        loadAnalytics(),
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadAdminLogs = async (search = adminLogSearch) => {
    setAdminLogsLoading(true);
    try {
      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";
      const response = await apiFetch(`${API}/api/admin/audit-logs${query}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load audit logs");
      }
      setAdminLogs(data.logs || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminLogsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadAdminAccess();
        if (cancelled) return;

        const accessResponse = await apiFetch(`${API}/api/admin/access`);
        const accessData = await accessResponse.json();

        if (!accessData.isAdmin) {
          setLoading(false);
          return;
        }

        await Promise.all([
          loadCases(),
          loadItems(),
          loadAnalytics(),
          loadAdminUsers(),
          loadAdminActivity(),
          loadAdminPayments(),
          loadAdminLogs(),
        ]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Select first case
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !selectedCaseId &&
      cases.length > 0
    ) {
      setSelectedCaseId(Number(cases[0].id));
    }
  }, [cases, selectedCaseId]);

  /*
  |--------------------------------------------------------------------------
  | Load selected case whenever selection changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (selectedCaseId) {
      loadCase(selectedCaseId);
    }
  }, [selectedCaseId]);

  /*
  |--------------------------------------------------------------------------
  | Odds
  |--------------------------------------------------------------------------
  */

  const totalOdds = useMemo(
    () =>
      caseItems.reduce(
        (total, item) =>
          total + Number(item.probability || 0),
        0
      ),
    [caseItems]
  );

  const oddsDifference = 100 - totalOdds;

  const oddsValid =
    Math.abs(totalOdds - 100) < 0.001;

  /*
  |--------------------------------------------------------------------------
  | Create case
  |--------------------------------------------------------------------------
  */

  const createCase = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const price = Number(newCase.price);

    if (
      !newCase.name.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Enter a valid case name and price."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        `${API}/api/admin/cases`,
        {
          method: "POST",
          body: JSON.stringify({
            name: newCase.name.trim(),
            priceCents: Math.round(price * 100),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create case"
        );
      }

      setNewCase({
        name: "",
        price: "",
      });

      setShowCreateCase(false);

      await loadCases();

      setSelectedCaseId(Number(data.id));

      setSuccess("Case created successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update case
  |--------------------------------------------------------------------------
  */

  const saveCaseDetails = async () => {
    if (!selectedCase) return;

    setError("");
    setSuccess("");

    const price = Number(editingCase.price);

    if (
      !editingCase.name.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Enter a valid case name and price."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        `${API}/api/admin/cases/${selectedCase.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: editingCase.name.trim(),
            priceCents: Math.round(price * 100),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update case"
        );
      }

      setSelectedCase((current) => ({
        ...current,
        ...data,
      }));

      await loadCases();

      setSuccess("Case details saved.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle active state
  |--------------------------------------------------------------------------
  */

  const toggleCaseStatus = async () => {
    if (!selectedCase) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await apiFetch(
        `${API}/api/admin/cases/${selectedCase.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            active: !selectedCase.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update case status"
        );
      }

      setSelectedCase((current) => ({
        ...current,
        ...data,
      }));

      await loadCases();

      setSuccess(
        data.active
          ? "Case activated."
          : "Case disabled."
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update local probability
  |--------------------------------------------------------------------------
  */

  const updateProbability = (
    itemId,
    probability
  ) => {
    setCaseItems((current) =>
      current.map((item) =>
        Number(item.id) === Number(itemId)
          ? {
              ...item,
              probability:
                probability === ""
                  ? ""
                  : Number(probability),
            }
          : item
      )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Save reward odds
  |--------------------------------------------------------------------------
  */

 const saveReward = async (item) => {
  if (!selectedCase) return;

  const probability = Number(item.probability);

  if (
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 100
  ) {
    setError(`Invalid odds for ${item.name}.`);
    return;
  }

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    // Save item information, including image URL
    const itemResponse = await apiFetch(
      `${API}/api/admin/items/${item.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: item.name,
          rarity: item.rarity,
          valueCents: Number(item.value_cents),
          imageUrl: item.image_url || null,
        }),
      }
    );

    const itemData = await itemResponse.json();

    if (!itemResponse.ok) {
      throw new Error(
        itemData.error || "Failed to save item"
      );
    }

    // Save the odds for this case
    const oddsResponse = await apiFetch(
      `${API}/api/admin/case-items`,
      {
        method: "POST",
        body: JSON.stringify({
          caseId: Number(selectedCase.id),
          itemId: Number(item.id),
          probability,
        }),
      }
    );

    const oddsData = await oddsResponse.json();

    if (!oddsResponse.ok) {
      throw new Error(
        oddsData.error || "Failed to save reward odds"
      );
    }

    // Reload the case so the saved image/odds are reflected
    await loadCase(selectedCase.id);

    // Reload the item list as well
    await loadItems();

    setSuccess(`${item.name} saved successfully.`);
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setSaving(false);
  }
};

  /*
  |--------------------------------------------------------------------------
  | Save every reward
  |--------------------------------------------------------------------------
  */

  const saveAllRewards = async () => {
    if (!selectedCase) return;

    if (!oddsValid) {
      setError(
        `Odds must total 100%. Current total is ${totalOdds.toFixed(
          2
        )}%.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      for (const item of caseItems) {
        const probability = Number(
          item.probability
        );

        if (
          !Number.isFinite(probability) ||
          probability < 0 ||
          probability > 100
        ) {
          throw new Error(
            `Invalid odds for ${item.name}.`
          );
        }

        // Save the reward information, including its image URL.
        const itemResponse = await apiFetch(
          `${API}/api/admin/items/${item.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: item.name,
              rarity: item.rarity,
              valueCents: Number(item.value_cents),
              imageUrl: item.image_url || null,
            }),
          }
        );

        const itemData = await itemResponse.json();

        if (!itemResponse.ok) {
          throw new Error(
            itemData.error ||
              `Failed to save ${item.name}`
          );
        }

        // Save the odds for this case.
        const response = await apiFetch(
          `${API}/api/admin/case-items`,
          {
            method: "POST",
            body: JSON.stringify({
              caseId: Number(selectedCase.id),
              itemId: Number(item.id),
              probability,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Failed to save ${item.name}`
          );
        }
      }

      await loadCase(selectedCase.id);

      setSuccess(
        "All reward odds saved successfully."
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Add existing reward
  |--------------------------------------------------------------------------
  */

  const addReward = async (event) => {
    event.preventDefault();

    if (!selectedCase) return;

    const itemId = Number(
      rewardForm.itemId
    );

    const probability = Number(
      rewardForm.probability
    );

    if (
      !Number.isInteger(itemId) ||
      !Number.isFinite(probability) ||
      probability < 0 ||
      probability > 100
    ) {
      setError(
        "Select an item and enter valid odds."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `${API}/api/admin/case-items`,
        {
          method: "POST",
          body: JSON.stringify({
            caseId: Number(selectedCase.id),
            itemId,
            probability,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add reward"
        );
      }

      setRewardForm({
        itemId: "",
        probability: "",
      });

      setShowAddReward(false);

      await loadCase(selectedCase.id);

      setSuccess("Reward added to case.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Remove reward
  |--------------------------------------------------------------------------
  */

  const removeReward = async (item) => {
    if (!selectedCase) return;

    const confirmed = window.confirm(
      `Remove "${item.name}" from this case?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `${API}/api/admin/case-items/${selectedCase.id}/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to remove reward"
        );
      }

      await loadCase(selectedCase.id);

      setSuccess(
        `${item.name} removed from case.`
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Create item
  |--------------------------------------------------------------------------
  */

  const createItem = async (event) => {
    event.preventDefault();

    const value = Number(newItem.value);

    if (
      !newItem.name.trim() ||
      !RARITIES.includes(newItem.rarity) ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      setError(
        "Enter a valid item name, rarity and value."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `${API}/api/admin/items`,
        {
          method: "POST",
          body: JSON.stringify({
            name: newItem.name.trim(),
            rarity: newItem.rarity,
            valueCents: Math.round(
              value * 100
            ),
            imageUrl: newItem.imageUrl.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create item"
        );
      }

      setNewItem({
        name: "",
        rarity: "Common",
        value: "",
        imageUrl: "",
      });

      setShowCreateItem(false);

      await loadItems();

      setSuccess("Reward item created.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Case management helpers
  |--------------------------------------------------------------------------
  */

  const filteredCases = useMemo(() => {
    const query = caseSearch.trim().toLowerCase();
    if (!query) return cases;
    return cases.filter((item) =>
      String(item.name || "").toLowerCase().includes(query) ||
      String(item.id || "").includes(query)
    );
  }, [cases, caseSearch]);

  const filteredCaseItems = useMemo(() => {
    const query = rewardSearch.trim().toLowerCase();
    if (!query) return caseItems;
    return caseItems.filter((item) =>
      String(item.name || "").toLowerCase().includes(query) ||
      String(item.rarity || "").toLowerCase().includes(query) ||
      String(item.id || "").includes(query)
    );
  }, [caseItems, rewardSearch]);

  const distributeOddsEvenly = () => {
    if (!caseItems.length) return;
    const count = caseItems.length;
    const base = Math.floor((100 / count) * 100) / 100;
    const values = caseItems.map(() => base);
    const remainder = Number((100 - base * count).toFixed(2));
    values[values.length - 1] = Number((values[values.length - 1] + remainder).toFixed(2));
    setCaseItems((current) =>
      current.map((item, index) => ({
        ...item,
        probability: values[index],
      }))
    );
    setSuccess("Odds distributed evenly. Review and save when ready.");
  };

  const duplicateSelectedCase = async () => {
    if (!selectedCase) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const caseResponse = await apiFetch(`${API}/api/admin/cases`, {
        method: "POST",
        body: JSON.stringify({
          name: `${selectedCase.name} Copy`,
          priceCents: Number(selectedCase.price_cents),
        }),
      });

      const newCaseData = await caseResponse.json();
      if (!caseResponse.ok) {
        throw new Error(newCaseData.error || "Failed to duplicate case");
      }

      for (const item of caseItems) {
        const response = await apiFetch(`${API}/api/admin/case-items`, {
          method: "POST",
          body: JSON.stringify({
            caseId: Number(newCaseData.id),
            itemId: Number(item.id),
            probability: Number(item.probability || 0),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Failed to copy ${item.name}`);
        }
      }

      await loadCases();
      setSelectedCaseId(Number(newCaseData.id));
      setSuccess(`Created ${newCaseData.name} with ${caseItems.length} rewards.`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Items that aren't already in the selected case
  |--------------------------------------------------------------------------
  */

  const availableItems = useMemo(() => {
    const existingIds = new Set(
      caseItems.map((item) =>
        Number(item.id)
      )
    );

    return items.filter(
      (item) =>
        !existingIds.has(Number(item.id))
    );
  }, [items, caseItems]);

  if (adminAccessLoading || loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading CaseForge Admin...
        </div>
      </div>
    );
  }

  if (!adminAccess?.authenticated) {
    return (
      <div className="admin-page">
        <div className="admin-access-screen">
          <div className="admin-access-card">
            <div className="admin-brand-mark">✦</div>
            <div className="admin-eyebrow">ADMIN SECURITY</div>
            <h1>Sign in required</h1>
            <p>Sign in to your CaseForge account first, then return to the Admin Panel.</p>
            <a className="admin-primary-button" href="/">Back to CaseForge</a>
          </div>
        </div>
      </div>
    );
  }

  if (!adminAccess?.isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-access-screen">
          <div className="admin-access-card">
            <div className="admin-brand-mark">✦</div>
            <div className="admin-eyebrow">ADMIN SECURITY</div>
            <h1>Admin access required</h1>
            <p>This account is authenticated but does not have administrator access.</p>
            {adminAccess?.needsBootstrap ? (
              <button
                type="button"
                className="admin-primary-button"
                onClick={bootstrapAdmin}
                disabled={adminBootstrapLoading}
              >
                {adminBootstrapLoading ? "Enabling..." : "Enable local admin access"}
              </button>
            ) : (
              <div className="admin-security-note">
                Admin bootstrap is disabled. Configure an administrator on the server.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-nav">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            ✦
          </div>

          <div>
            <strong>
              CASE<span>FORGE</span>
            </strong>

            <small>ADMIN PANEL</small>
          </div>
        </div>

        <div className="admin-nav-right">
          <a href="/">← Back to site</a>

          <button
            type="button"
            onClick={() => {
              loadCases();
              loadItems();
              loadAnalytics();
              loadAdminUsers();
              loadAdminActivity();
              loadAdminPayments();
              loadAdminLogs();
              if (selectedUserId) {
                loadAdminInventory(selectedUserId);
                loadAdminInventoryHistory(selectedUserId);
              }
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <div className="admin-shell">
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            <button type="button" className="admin-sidebar-item" onClick={() => {
              setAdminView("cases");
              document.querySelector(".admin-analytics")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>
              <span className="admin-sidebar-icon">⌂</span><span>Dashboard</span>
            </button>
            <button type="button" className="admin-sidebar-item" onClick={() => document.querySelector(".admin-analytics")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              <span className="admin-sidebar-icon">▥</span><span>Analytics</span>
            </button>
            <button type="button" className={adminView === "cases" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => setAdminView("cases")}>
              <span className="admin-sidebar-icon">▣</span><span>Cases</span>
            </button>
            <button type="button" className="admin-sidebar-item" onClick={() => setAdminView("cases")}>
              <span className="admin-sidebar-icon">♔</span><span>Rewards</span>
            </button>
            <button type="button" className={adminView === "inventory" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("inventory"); if (selectedUserId) { loadAdminInventory(selectedUserId); loadAdminInventoryHistory(selectedUserId); } }}>
              <span className="admin-sidebar-icon">▣</span><span>Inventory</span>
            </button>
            <button type="button" className={adminView === "payments" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("payments"); loadAdminPayments(); }}>
              <span className="admin-sidebar-icon">$</span><span>Payments</span>
            </button>
            <button type="button" className={adminView === "users" || adminView === "activity" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("activity"); loadAdminActivity(); }}>
              <span className="admin-sidebar-icon">♟</span><span>Users &amp; Activity</span>
            </button>
            <button type="button" className={adminView === "security" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => setAdminView("security")}>
              <span className="admin-sidebar-icon">⚙</span><span>Security</span>
            </button>
            <button type="button" className={adminView === "logs" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("logs"); loadAdminLogs(); }}>
              <span className="admin-sidebar-icon">☷</span><span>Logs</span>
            </button>
            <button type="button" className="admin-sidebar-item" onClick={() => window.location.href = "/"}>
              <span className="admin-sidebar-icon">↪</span><span>Logout</span>
            </button>
          </nav>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-icon">◆</div>
            <div><strong>Admin</strong><span>Administrator</span></div>
            <span className="admin-sidebar-chevron">⌄</span>
          </div>
        </aside>
        <main className={`admin-content admin-main-content view-${adminView}`}>
        <div className="admin-heading">
          <div>
            <div className="admin-eyebrow">
              CASE MANAGEMENT
            </div>

            <h1>Admin Dashboard</h1>

            <p>
              Manage cases, rewards, pricing and
              probability tables.
            </p>
          </div>

          <div className="admin-heading-actions">
            <button
              className="admin-secondary-button"
              onClick={() =>
                setShowCreateItem(true)
              }
            >
              + Create Reward
            </button>

            <button
              className="admin-primary-button"
              onClick={() =>
                setShowCreateCase(true)
              }
            >
              + Create Case
            </button>
          </div>
        </div>

        {analytics && (
          <section className="admin-analytics">
            <div className="admin-analytics-head">
              <div>
                <div className="admin-eyebrow">PLATFORM OVERVIEW</div>
                <h2>Analytics</h2>
                <p>Live totals calculated from your database.</p>
              </div>
              <button
                type="button"
                className="admin-analytics-refresh"
                onClick={loadAnalytics}
                disabled={analyticsLoading}
              >
                {analyticsLoading ? "Refreshing..." : "↻ Refresh analytics"}
              </button>
            </div>

            <div className="admin-analytics-grid">
              <div className="admin-stat-card"><div className="admin-stat-icon users">♟</div><div><span>USERS</span><strong>{analytics.overview.users.toLocaleString()}</strong><small>Total registered users</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon openings">▣</div><div><span>OPENINGS</span><strong>{analytics.overview.openings.toLocaleString()}</strong><small>Total case openings</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon revenue">$</div><div><span>CASE REVENUE</span><strong>${(analytics.overview.revenueCents / 100).toFixed(2)}</strong><small>Total from case openings</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon sales">🛒</div><div><span>ITEM SALES</span><strong>${(analytics.overview.itemSalesCents / 100).toFixed(2)}</strong><small>Total from item sales</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon rewards">◆</div><div><span>REWARDS PAID</span><strong>${(analytics.overview.rewardsValueCents / 100).toFixed(2)}</strong><small>Total rewards value</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon active">▰</div><div><span>ACTIVE CASES</span><strong>{analytics.overview.activeCases}</strong><small>Currently active cases</small></div></div>
            </div>

            <div className="admin-analytics-secondary">
              <div className="admin-analytics-highlight">
                <span>MOST OPENED CASE</span>
                <strong>{analytics.topCase?.name || "No openings yet"}</strong>
                <small>
                  {analytics.topCase ? `${analytics.topCase.openings} openings` : "Waiting for data"}
                </small>
              </div>

              <div className="admin-analytics-highlight">
                <span>MOST WON REWARD</span>
                <strong>{analytics.topReward?.name || "No rewards yet"}</strong>
                <small>
                  {analytics.topReward ? `${analytics.topReward.wins} wins · ${analytics.topReward.rarity}` : "Waiting for data"}
                </small>
              </div>

              <div className="admin-analytics-highlight">
                <span>TOTAL DEPOSITS</span>
                <strong>${(analytics.overview.depositsCents / 100).toFixed(2)}</strong>
                <small>Local demo deposits</small>
              </div>
            </div>

            <div className="admin-recent-openings">
              <div className="admin-analytics-subhead">
                <div>
                  <span>RECENT ACTIVITY</span>
                  <strong>Latest openings</strong>
                </div>
              </div>

              {analytics.recentOpenings.length === 0 ? (
                <div className="admin-analytics-empty">No openings yet.</div>
              ) : (
                <div className="admin-recent-opening-list">
                  {analytics.recentOpenings.map((opening) => (
                    <div className="admin-recent-opening" key={opening.id}>
                      <div className={`admin-mini-rarity ${rarityClass(opening.rarity)}`}></div>
                      <div>
                        <strong>{opening.username}</strong>
                        <span>{opening.case_name} → {opening.item_name}</span>
                      </div>
                      <b>${(Number(opening.value_cents || 0) / 100).toFixed(2)}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="admin-command-center">
          <div className="admin-command-head">
            <div>
              <div className="admin-eyebrow">COMMAND CENTER</div>
              <h2>Platform Control</h2>
              <p>Jump directly into the areas that need the most attention.</p>
            </div>
            <div className="admin-command-status">
              <span className="admin-status-dot"></span>
              <strong>System online</strong>
            </div>
          </div>

          <div className="admin-command-grid">
            <button
              type="button"
              className="admin-command-card users"
              onClick={() => {
                setAdminView("users");
                loadAdminUsers();
              }}
            >
              <span className="admin-command-icon">♟</span>
              <span className="admin-command-copy">
                <strong>User Management</strong>
                <small>
                  {adminUsers.length.toLocaleString()} loaded accounts
                </small>
              </span>
              <span className="admin-command-arrow">→</span>
            </button>

            <button
              type="button"
              className="admin-command-card payments"
              onClick={() => {
                setAdminView("payments");
                loadAdminPayments();
              }}
            >
              <span className="admin-command-icon">$</span>
              <span className="admin-command-copy">
                <strong>Payments</strong>
                <small>
                  {adminPayments.filter((payment) =>
                    String(payment.status || "").toLowerCase() === "pending"
                  ).length} pending requests
                </small>
              </span>
              <span className="admin-command-arrow">→</span>
            </button>

            <button
              type="button"
              className="admin-command-card inventory"
              onClick={() => {
                setAdminView("inventory");
                if (selectedUserId) {
                  loadAdminInventory(selectedUserId);
                  loadAdminInventoryHistory(selectedUserId);
                }
              }}
            >
              <span className="admin-command-icon">▣</span>
              <span className="admin-command-copy">
                <strong>Inventory Control</strong>
                <small>
                  {selectedUser ? `${selectedUser.username}'s inventory` : "Choose an account to manage"}
                </small>
              </span>
              <span className="admin-command-arrow">→</span>
            </button>

            <button
              type="button"
              className="admin-command-card cases"
              onClick={() => setAdminView("cases")}
            >
              <span className="admin-command-icon">◇</span>
              <span className="admin-command-copy">
                <strong>Case & Reward Editor</strong>
                <small>
                  {cases.length} configured cases
                </small>
              </span>
              <span className="admin-command-arrow">→</span>
            </button>
          </div>
        </section>

        <section className="admin-user-snapshot">
          <div className="admin-user-snapshot-head">
            <div>
              <div className="admin-eyebrow">USER MANAGEMENT</div>
              <h2>Account Snapshot</h2>
              <p>Quick view of the most recently loaded accounts.</p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                setAdminView("users");
                loadAdminUsers();
              }}
            >
              Open full user manager →
            </button>
          </div>

          {adminUsers.length === 0 ? (
            <div className="admin-user-snapshot-empty">
              No user data loaded yet. Open User Management to load accounts.
            </div>
          ) : (
            <div className="admin-user-snapshot-table-wrap">
              <table className="admin-user-snapshot-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Balance</th>
                    <th>Inventory</th>
                    <th>Openings</th>
                    <th>Spent</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.slice(0, 6).map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => loadSelectedUser(user.id)}
                      className="admin-user-snapshot-row"
                    >
                      <td>
                        <div className="admin-user-snapshot-name">
                          <span className="admin-user-avatar">
                            {String(user.username || "?").charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{user.username}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{money(user.balance_cents)}</td>
                      <td>{Number(user.inventory_count || 0)}</td>
                      <td>{Number(user.openings_count || 0)}</td>
                      <td>{money(user.total_spent_cents)}</td>
                      <td>
                        {user.is_admin ? (
                          <span className="admin-role-badge">ADMIN</span>
                        ) : (
                          <span className="admin-user-role-normal">USER</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {error && (
          <div className="admin-alert admin-alert-error">
            <strong>Error</strong>
            <span>{error}</span>

            <button
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="admin-alert admin-alert-success">
            <strong>Saved</strong>
            <span>{success}</span>

            <button
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="admin-management-card">
          <div className="admin-management-head">
            <div>
              <div className="admin-eyebrow">USER & ACTIVITY MANAGEMENT</div>
              <h2>Users & Activity</h2>
              <p>Inspect accounts, balances, case openings and wallet transactions.</p>
            </div>
            <div className="admin-management-tabs">
              <button className={adminView === "cases" ? "active" : ""} onClick={() => setAdminView("cases")}>Cases</button>
              <button className={adminView === "users" ? "active" : ""} onClick={() => { setAdminView("users"); loadAdminUsers(); }}>Users</button>
              <button className={adminView === "activity" ? "active" : ""} onClick={() => { setAdminView("activity"); loadAdminActivity(); }}>Activity</button>
            </div>
          </div>

          {(adminView === "users" || adminView === "activity") && (
            <div className="admin-management-body">
              {adminView === "users" ? (
                <>
                  <div className="admin-management-toolbar">
                    <div className="admin-search-wrap">
                      <span>⌕</span>
                      <input
                        value={adminUsersSearch}
                        onChange={(event) => setAdminUsersSearch(event.target.value)}
                        onKeyDown={(event) => { if (event.key === "Enter") loadAdminUsers(); }}
                        placeholder="Search username or email..."
                      />
                    </div>
                    <button className="admin-secondary-button" onClick={() => loadAdminUsers()} disabled={adminUsersLoading}>
                      {adminUsersLoading ? "Loading..." : "Search users"}
                    </button>
                  </div>

                  <div className="admin-users-layout">
                    <div className="admin-user-list">
                      {adminUsers.length === 0 ? (
                        <div className="admin-management-empty">No users found.</div>
                      ) : (
                        adminUsers.map((user) => (
                          <button
                            type="button"
                            key={user.id}
                            className={`admin-user-row ${Number(selectedUserId) === Number(user.id) ? "active" : ""}`}
                            onClick={() => loadSelectedUser(user.id)}
                          >
                            <div className="admin-user-avatar">{String(user.username || "?").charAt(0).toUpperCase()}</div>
                            <div className="admin-user-main">
                              <strong>
                                {user.username}
                                {user.is_admin && (
                                  <em className="admin-role-badge">ADMIN</em>
                                )}
                              </strong>
                              <span>{user.email}</span>
                            </div>
                            <div className="admin-user-balance">{money(user.balance_cents)}</div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="admin-user-detail">
                      {!selectedUser ? (
                        <div className="admin-management-empty">Select a user to view their account.</div>
                      ) : selectedUserLoading ? (
                        <div className="admin-management-empty">Loading user...</div>
                      ) : (
                        <>
                          <div className="admin-user-detail-head admin-user-detail-head-premium">
                            <div className="admin-user-profile-line">
                              <div className="admin-user-avatar large">{String(selectedUser.username || "?").charAt(0).toUpperCase()}</div>
                              <div className="admin-user-profile-copy">
                                <div className="admin-user-profile-name-row">
                                  <h3>{selectedUser.username}</h3>
                                  {selectedUser.is_admin ? (
                                    <span className="admin-role-badge">ADMIN</span>
                                  ) : (
                                    <span className="admin-user-role-normal">USER</span>
                                  )}
                                </div>
                                <span>{selectedUser.email}</span>
                                <small>
                                  User #{selectedUser.id}
                                  {selectedUser.created_at
                                    ? ` · Joined ${new Date(selectedUser.created_at).toLocaleDateString()}`
                                    : ""}
                                </small>
                              </div>
                            </div>

                            <div className="admin-user-detail-actions">
                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => openAdminInventoryForUser(selectedUser.id)}
                              >
                                Inventory →
                              </button>
                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => {
                                  setAdminActivitySearch(selectedUser.username);
                                  setAdminView("activity");
                                  loadAdminActivity(selectedUser.username);
                                }}
                              >
                                Activity →
                              </button>
                            </div>
                          </div>

                          <div className="admin-user-stats admin-user-stats-premium">
                            <div className="featured">
                              <span>AVAILABLE BALANCE</span>
                              <strong>{money(selectedUser.balance_cents)}</strong>
                            </div>
                            <div><span>INVENTORY</span><strong>{selectedUser.inventory_count}</strong></div>
                            <div><span>OPENINGS</span><strong>{selectedUser.openings_count}</strong></div>
                            <div><span>SPENT</span><strong>{money(selectedUser.total_spent_cents)}</strong></div>
                            <div><span>REWARDS WON</span><strong>{money(selectedUser.total_rewards_value_cents)}</strong></div>
                          </div>

                          <div className="admin-user-control-grid">
                            <div className="admin-role-management admin-user-control-card">
                              <div className="admin-user-control-copy">
                                <span className="admin-user-control-label">ACCESS CONTROL</span>
                                <strong>Administrator access</strong>
                                <small>
                                  {selectedUser.is_admin
                                    ? "This account can access the Admin Panel."
                                    : "This account is a normal user."}
                                </small>
                              </div>
                              <button
                                className={selectedUser.is_admin ? "admin-danger-button" : "admin-primary-button"}
                                onClick={updateAdminRole}
                                disabled={
                                  adminRoleUpdating ||
                                  (selectedUser.is_admin && Number(selectedUser.id) === Number(adminAccess?.user?.id))
                                }
                              >
                                {adminRoleUpdating
                                  ? "Saving..."
                                  : selectedUser.is_admin
                                  ? "Remove admin access"
                                  : "Make Admin"}
                              </button>
                            </div>

                            <div className="admin-balance-adjust admin-user-control-card">
                              <div className="admin-user-control-copy">
                                <span className="admin-user-control-label">WALLET CONTROL</span>
                                <strong>Adjust demo balance</strong>
                                <small>Local/admin testing only.</small>
                              </div>
                              <div className="admin-balance-controls">
                                <select value={balanceAdjustmentMode} onChange={(event) => setBalanceAdjustmentMode(event.target.value)}>
                                  <option value="add">Add</option>
                                  <option value="subtract">Subtract</option>
                                  <option value="set">Set to</option>
                                </select>
                                <div className="admin-money-input">
                                  <b>$</b>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={balanceAdjustment}
                                    onChange={(event) => setBalanceAdjustment(event.target.value)}
                                    placeholder="0.00"
                                  />
                                </div>
                                <button
                                  className="admin-primary-button"
                                  onClick={adjustUserBalance}
                                  disabled={balanceAdjusting}
                                >
                                  {balanceAdjusting ? "Saving..." : "Update balance"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="admin-management-toolbar">
                    <div className="admin-activity-tabs">
                      <button className={adminActivityTab === "openings" ? "active" : ""} onClick={() => setAdminActivityTab("openings")}>Case Openings</button>
                      <button className={adminActivityTab === "transactions" ? "active" : ""} onClick={() => setAdminActivityTab("transactions")}>Transactions</button>
                    </div>
                    <div className="admin-search-wrap compact">
                      <span>⌕</span>
                      <input value={adminActivitySearch} onChange={(event) => setAdminActivitySearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") loadAdminActivity(); }} placeholder="Search user, case or reward..." />
                    </div>
                    <button className="admin-secondary-button" onClick={() => loadAdminActivity()}>↻ Refresh</button>
                  </div>

                  {adminActivityTab === "openings" ? (
                    <div className="admin-activity-table-wrap">
                      <table className="admin-activity-table">
                        <thead><tr><th>User</th><th>Case</th><th>Reward</th><th>Rarity</th><th>Value</th><th>Cost</th><th>Date</th></tr></thead>
                        <tbody>
                          {adminOpenings.length === 0 ? <tr><td colSpan="7" className="admin-table-empty">No openings found.</td></tr> : adminOpenings.map((opening) => (
                            <tr key={opening.id}>
                              <td><strong>{opening.username}</strong><small>#{opening.user_id}</small></td>
                              <td>{opening.case_name}</td>
                              <td>{opening.item_name}</td>
                              <td><span className={`admin-rarity-badge ${rarityClass(opening.rarity)}`}>{opening.rarity}</span></td>
                              <td className="admin-table-money">{money(opening.value_cents)}</td>
                              <td className="admin-table-muted">{money(opening.cost_cents)}</td>
                              <td className="admin-table-muted">{new Date(opening.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="admin-activity-table-wrap">
                      <table className="admin-activity-table">
                        <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Reference</th><th>Date</th></tr></thead>
                        <tbody>
                          {adminTransactions.length === 0 ? <tr><td colSpan="5" className="admin-table-empty">No transactions found.</td></tr> : adminTransactions.map((tx) => {
                            const amount = Number(tx.amount_cents || 0);
                            const label = String(tx.type || "transaction").replaceAll("_", " ");
                            return (
                              <tr key={tx.id}>
                                <td><strong>{tx.username}</strong><small>#{tx.user_id}</small></td>
                                <td className="admin-table-cap">{label}</td>
                                <td className={amount >= 0 ? "admin-table-positive" : "admin-table-negative"}>{amount >= 0 ? "+" : "-"}{money(Math.abs(amount))}</td>
                                <td className="admin-table-muted">{tx.reference || "—"}</td>
                                <td className="admin-table-muted">{new Date(tx.created_at).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>


        {adminView === "inventory" && (
          <section className="admin-management-card admin-inventory-section">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">INVENTORY MANAGEMENT</div>
                <h2>Admin Inventory</h2>
                <p>Inspect, grant and remove items from a user's server-side inventory.</p>
              </div>
              {selectedUser && (
                <div className="admin-inventory-user-pill">
                  <span>USER</span>
                  <strong>{selectedUser.username}</strong>
                </div>
              )}
            </div>

            <div className="admin-inventory-layout">
              <aside className="admin-inventory-users-panel">
                <div className="admin-panel-title">
                  <div>
                    <span>USERS</span>
                    <strong>{adminUsers.length} total</strong>
                  </div>
                </div>

                <div className="admin-search-wrap">
                  <span>⌕</span>
                  <input
                    value={adminUsersSearch}
                    onChange={(event) => setAdminUsersSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") loadAdminUsers();
                    }}
                    placeholder="Search users..."
                  />
                </div>

                <div className="admin-inventory-user-list">
                  {adminUsersLoading ? (
                    <div className="admin-management-empty">Loading users...</div>
                  ) : adminUsers.length === 0 ? (
                    <div className="admin-management-empty">No users found.</div>
                  ) : (
                    adminUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className={`admin-inventory-user-row ${
                          Number(selectedUserId) === Number(user.id) ? "active" : ""
                        }`}
                        onClick={() => openAdminInventoryForUser(user.id)}
                      >
                        <div className="admin-user-avatar">
                          {String(user.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{user.username}</strong>
                          <span>{user.inventory_count || 0} items</span>
                        </div>
                        <b>{money(user.balance_cents)}</b>
                      </button>
                    ))
                  )}
                </div>
              </aside>

              <div className="admin-inventory-main">
                {!selectedUser ? (
                  <div className="admin-inventory-empty-state">
                    <div className="admin-inventory-empty-icon">▣</div>
                    <h3>Select a user</h3>
                    <p>Choose a user from the left to inspect and manage their inventory.</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-inventory-user-head admin-inventory-user-head-premium">
                      <div className="admin-inventory-user-profile">
                        <div className="admin-user-avatar large">
                          {String(selectedUser.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="admin-eyebrow">SELECTED ACCOUNT</div>
                          <h3>{selectedUser.username}</h3>
                          <span>{selectedUser.email} · User #{selectedUser.id}</span>
                        </div>
                      </div>

                      <div className="admin-inventory-user-actions">
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => {
                            setAdminView("users");
                            setSelectedUserId(Number(selectedUser.id));
                            loadSelectedUser(selectedUser.id);
                          }}
                        >
                          User Details →
                        </button>
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => {
                            loadAdminInventory(selectedUser.id);
                            loadAdminInventoryHistory(selectedUser.id);
                          }}
                          disabled={adminInventoryLoading || adminInventoryHistoryLoading}
                        >
                          ↻ Refresh
                        </button>
                      </div>
                    </div>

                    <div className="admin-inventory-overview">
                      <div className="admin-inventory-overview-card featured">
                        <span>INVENTORY VALUE</span>
                        <strong>
                          {money(
                            adminInventory.reduce(
                              (sum, item) => sum + Number(item.value_cents || 0),
                              0
                            )
                          )}
                        </strong>
                        <small>Total active inventory value</small>
                      </div>

                      <div className="admin-inventory-overview-card">
                        <span>ITEMS OWNED</span>
                        <strong>{adminInventory.length}</strong>
                        <small>Active inventory items</small>
                      </div>

                      <div className="admin-inventory-overview-card">
                        <span>SELECTED</span>
                        <strong>{selectedInventoryItems.length}</strong>
                        <small>{money(selectedInventoryValue)} selected value</small>
                      </div>

                      <div className="admin-inventory-overview-card">
                        <span>ADMIN ACTIONS</span>
                        <strong>{adminInventoryHistory.length}</strong>
                        <small>Grant/remove history entries</small>
                      </div>
                    </div>

                    <div className="admin-management-toolbar admin-inventory-toolbar">
                      <div className="admin-activity-tabs">
                        <button className={adminInventoryTab === "inventory" ? "active" : ""} onClick={() => setAdminInventoryTab("inventory")}>Current Inventory</button>
                        <button className={adminInventoryTab === "history" ? "active" : ""} onClick={() => { setAdminInventoryTab("history"); loadAdminInventoryHistory(selectedUser.id); }}>Admin History</button>
                      </div>
                      <button className="admin-secondary-button" onClick={() => { loadAdminInventory(selectedUser.id); loadAdminInventoryHistory(selectedUser.id); }}>↻ Refresh</button>
                    </div>

                    {adminInventoryTab === "inventory" ? (
                      <>
                        <div className="admin-inventory-grant-card">
                          <div>
                            <div className="admin-eyebrow">GRANT ITEM</div>
                            <strong>Add an item to this user's inventory</strong>
                            <span>The item is inserted server-side and recorded in Admin History.</span>
                          </div>
                          <div className="admin-inventory-grant-controls">
                            <select value={adminInventoryItemId} onChange={(event) => setAdminInventoryItemId(event.target.value)}>
                              <option value="">Select reward...</option>
                              {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} · {item.rarity} · {money(item.value_cents)}
                                </option>
                              ))}
                            </select>
                            <input value={adminInventoryNote} onChange={(event) => setAdminInventoryNote(event.target.value)} placeholder="Optional note" maxLength={500} />
                            <button className="admin-primary-button" onClick={grantInventoryItem} disabled={adminInventoryGranting || !adminInventoryItemId}>
                              {adminInventoryGranting ? "Granting..." : "Grant Item"}
                            </button>
                          </div>
                        </div>

                        <div className="admin-inventory-filter-bar">
                          <div className="admin-inventory-search-wrap">
                            <span>⌕</span>
                            <input
                              value={adminInventorySearch}
                              onChange={(event) => setAdminInventorySearch(event.target.value)}
                              placeholder="Search item, item ID or inventory ID..."
                            />
                            {adminInventorySearch && (
                              <button type="button" onClick={() => setAdminInventorySearch("")} aria-label="Clear inventory search">×</button>
                            )}
                          </div>
                          <select
                            value={adminInventoryRarity}
                            onChange={(event) => setAdminInventoryRarity(event.target.value)}
                          >
                            <option value="all">All rarities</option>
                            <option value="Common">Common</option>
                            <option value="Rare">Rare</option>
                            <option value="Epic">Epic</option>
                            <option value="Legendary">Legendary</option>
                            <option value="Secret">Secret</option>
                          </select>
                          {(adminInventorySearch || adminInventoryRarity !== "all") && (
                            <button type="button" className="admin-secondary-button" onClick={clearAdminInventoryFilters}>Clear</button>
                          )}
                          <span className="admin-inventory-filter-count">Showing {filteredAdminInventory.length} of {adminInventory.length}</span>
                        </div>

                        <div className="admin-inventory-bulk-toolbar">
                          <div className="admin-inventory-bulk-info">
                            <strong>{selectedInventoryItems.length} selected</strong>
                            <span>{money(selectedInventoryValue)} total value</span>
                          </div>
                          <div className="admin-inventory-bulk-actions">
                            <button
                              type="button"
                              className="admin-secondary-button"
                              onClick={selectAllVisibleInventory}
                              disabled={filteredAdminInventory.length === 0 || allVisibleInventorySelected}
                            >
                              Select all visible
                            </button>
                            <button
                              type="button"
                              className="admin-secondary-button"
                              onClick={clearInventorySelection}
                              disabled={selectedInventoryItems.length === 0}
                            >
                              Clear selection
                            </button>
                            <button
                              type="button"
                              className="admin-danger-button admin-bulk-remove-button"
                              onClick={() => setAdminInventoryBulkModalOpen(true)}
                              disabled={selectedInventoryItems.length === 0 || adminInventoryBulkWorking}
                            >
                              {adminInventoryBulkWorking ? "Removing..." : "Bulk Remove"}
                            </button>
                          </div>
                        </div>

                        <div className="admin-activity-table-wrap">
                          <table className="admin-activity-table admin-inventory-table">
                            <thead>
                              <tr>
                                <th className="admin-inventory-checkbox-col">
                                  <input
                                    type="checkbox"
                                    aria-label="Select all visible inventory items"
                                    checked={allVisibleInventorySelected}
                                    onChange={(event) => {
                                      if (event.target.checked) {
                                        selectAllVisibleInventory();
                                      } else {
                                        setSelectedInventoryIds((current) => {
                                          const next = new Set(current);
                                          filteredAdminInventory.forEach((item) => next.delete(Number(item.id)));
                                          return next;
                                        });
                                      }
                                    }}
                                    disabled={filteredAdminInventory.length === 0}
                                  />
                                </th>
                                <th>Item</th>
                                <th>Rarity</th>
                                <th>Value</th>
                                <th>Inventory ID</th>
                                <th>Added</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminInventoryLoading ? (
                                <tr><td colSpan="7" className="admin-table-empty">Loading inventory...</td></tr>
                              ) : adminInventory.length === 0 ? (
                                <tr><td colSpan="7" className="admin-table-empty">This user has no active inventory items.</td></tr>
                              ) : filteredAdminInventory.length === 0 ? (
                                <tr><td colSpan="7" className="admin-table-empty">No inventory items match the current filters.</td></tr>
                              ) : (
                                filteredAdminInventory.map((item) => (
                                  <tr key={item.id} className={selectedInventoryIds.has(Number(item.id)) ? "admin-inventory-row-selected" : ""}>
                                    <td className="admin-inventory-checkbox-col">
                                      <input
                                        type="checkbox"
                                        aria-label={`Select ${item.name}`}
                                        checked={selectedInventoryIds.has(Number(item.id))}
                                        onChange={() => toggleInventorySelection(item.id)}
                                      />
                                    </td>
                                    <td>
                                      <strong>{item.name}</strong>
                                      <small>#{item.item_id}</small>
                                    </td>
                                    <td><span className={`admin-rarity-badge ${rarityClass(item.rarity)}`}>{item.rarity}</span></td>
                                    <td className="admin-table-money">{money(item.value_cents)}</td>
                                    <td className="admin-table-muted">#{item.id}</td>
                                    <td className="admin-table-muted">{new Date(item.created_at).toLocaleString()}</td>
                                    <td>
                                      <button
                                        className="admin-danger-button admin-compact-action"
                                        onClick={() => removeInventoryItem(item.id)}
                                        disabled={Number(adminInventoryRemovingId) === Number(item.id)}
                                      >
                                        {Number(adminInventoryRemovingId) === Number(item.id) ? "Removing..." : "Remove"}
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="admin-inventory-filter-bar history">
                          <div className="admin-inventory-search-wrap">
                            <span>⌕</span>
                            <input
                              value={adminInventoryHistorySearch}
                              onChange={(event) => setAdminInventoryHistorySearch(event.target.value)}
                              placeholder="Search item, admin, note or ID..."
                            />
                            {adminInventoryHistorySearch && (
                              <button type="button" onClick={() => setAdminInventoryHistorySearch("")} aria-label="Clear history search">×</button>
                            )}
                          </div>
                          <select
                            value={adminInventoryHistoryAction}
                            onChange={(event) => setAdminInventoryHistoryAction(event.target.value)}
                          >
                            <option value="all">All actions</option>
                            <option value="grant">Granted</option>
                            <option value="remove">Removed</option>
                          </select>
                          <select
                            value={adminInventoryHistoryRarity}
                            onChange={(event) => setAdminInventoryHistoryRarity(event.target.value)}
                          >
                            <option value="all">All rarities</option>
                            <option value="Common">Common</option>
                            <option value="Rare">Rare</option>
                            <option value="Epic">Epic</option>
                            <option value="Legendary">Legendary</option>
                            <option value="Secret">Secret</option>
                          </select>
                          {(adminInventoryHistorySearch || adminInventoryHistoryAction !== "all" || adminInventoryHistoryRarity !== "all") && (
                            <button type="button" className="admin-secondary-button" onClick={clearAdminInventoryHistoryFilters}>Clear</button>
                          )}
                          <span className="admin-inventory-filter-count">Showing {filteredAdminInventoryHistory.length} of {adminInventoryHistory.length}</span>
                        </div>

                        <div className="admin-activity-table-wrap">
                          <table className="admin-activity-table admin-inventory-history-table">
                          <thead>
                            <tr>
                              <th>Action</th>
                              <th>Item</th>
                              <th>Value</th>
                              <th>Admin</th>
                              <th>Note</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminInventoryHistoryLoading ? (
                              <tr><td colSpan="6" className="admin-table-empty">Loading history...</td></tr>
                            ) : adminInventoryHistory.length === 0 ? (
                              <tr><td colSpan="6" className="admin-table-empty">No Admin inventory actions recorded yet.</td></tr>
                            ) : filteredAdminInventoryHistory.length === 0 ? (
                              <tr><td colSpan="6" className="admin-table-empty">No history entries match the current filters.</td></tr>
                            ) : (
                              filteredAdminInventoryHistory.map((entry) => (
                                <tr key={entry.id}>
                                  <td><span className={`admin-inventory-action-badge ${entry.action}`}>{entry.action === "grant" ? "Granted" : "Removed"}</span></td>
                                  <td><strong>{entry.name}</strong><small>#{entry.item_id}</small></td>
                                  <td className="admin-table-money">{money(entry.value_cents)}</td>
                                  <td className="admin-table-muted">{entry.admin_username || "System"}</td>
                                  <td className="admin-table-muted">{entry.note || "—"}</td>
                                  <td className="admin-table-muted">{new Date(entry.created_at).toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {adminView === "payments" && (
          <section className="admin-management-card admin-payments-section">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">PAYMENT OPERATIONS</div>
                <h2>Payment Requests</h2>
                <p>Review pending deposits and withdrawals. Wallet funds only move after this server-side review.</p>
              </div>
              <div className="admin-payment-status-tabs">
                {[
                  ["pending", "Pending"],
                  ["approved", "Approved"],
                  ["rejected", "Rejected"],
                  ["all", "All"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={adminPaymentStatus === value ? "active" : ""}
                    onClick={() => {
                      setAdminPaymentStatus(value);
                      loadAdminPayments(value, adminPaymentSearch);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-payment-overview">
              {(() => {
                const loadedPending = adminPayments.filter(
                  (payment) => String(payment.status || "").toLowerCase() === "pending"
                ).length;

                const loadedDeposits = adminPayments.filter(
                  (payment) => payment.direction === "deposit"
                );

                const loadedWithdrawals = adminPayments.filter(
                  (payment) => payment.direction !== "deposit"
                );

                const loadedValue = adminPayments.reduce(
                  (sum, payment) => sum + Number(payment.amount_cents || 0),
                  0
                );

                const depositValue = loadedDeposits.reduce(
                  (sum, payment) => sum + Number(payment.amount_cents || 0),
                  0
                );

                const withdrawalValue = loadedWithdrawals.reduce(
                  (sum, payment) => sum + Number(payment.amount_cents || 0),
                  0
                );

                return (
                  <>
                    <div className="admin-payment-stat pending">
                      <span>REVIEW QUEUE</span>
                      <strong>{loadedPending}</strong>
                      <small>Pending in current view</small>
                    </div>

                    <div className="admin-payment-stat">
                      <span>LOADED REQUESTS</span>
                      <strong>{adminPayments.length}</strong>
                      <small>Matching current filter</small>
                    </div>

                    <div className="admin-payment-stat positive">
                      <span>DEPOSITS</span>
                      <strong>{money(depositValue)}</strong>
                      <small>{loadedDeposits.length} loaded</small>
                    </div>

                    <div className="admin-payment-stat negative">
                      <span>WITHDRAWALS</span>
                      <strong>{money(withdrawalValue)}</strong>
                      <small>{loadedWithdrawals.length} loaded</small>
                    </div>

                    <div className="admin-payment-stat total">
                      <span>TOTAL VALUE</span>
                      <strong>{money(loadedValue)}</strong>
                      <small>Current payment view</small>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="admin-management-body">
              <div className="admin-management-toolbar">
                <div className="admin-search-wrap">
                  <span>⌕</span>
                  <input
                    value={adminPaymentSearch}
                    onChange={(event) => setAdminPaymentSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") loadAdminPayments();
                    }}
                    placeholder="Search user, email or request ID..."
                  />
                </div>
                <button
                  className="admin-secondary-button"
                  onClick={() => loadAdminPayments()}
                  disabled={adminPaymentsLoading}
                >
                  {adminPaymentsLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              <div className="admin-activity-table-wrap">
                <table className="admin-activity-table admin-payment-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPayments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-table-empty">No payment requests found.</td>
                      </tr>
                    ) : (
                      adminPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td>#{payment.id}</td>
                          <td>
                            <strong>{payment.username}</strong>
                            <small>#{payment.user_id}</small>
                          </td>
                          <td className="admin-payment-direction">
                            {payment.direction === "deposit" ? "Deposit" : "Withdrawal"}
                          </td>
                          <td className="admin-table-money">{money(payment.amount_cents)}</td>
                          <td>
                            <span className={`admin-payment-status ${payment.status}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="admin-table-muted">
                            {new Date(payment.created_at).toLocaleString()}
                          </td>
                          <td>
                            {payment.status === "pending" ? (
                              <div className="admin-payment-actions">
                                <button
                                  className="admin-payment-approve"
                                  onClick={() => reviewPayment(payment.id, "approve")}
                                  disabled={saving}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  className="admin-payment-reject"
                                  onClick={() => reviewPayment(payment.id, "reject")}
                                  disabled={saving}
                                >
                                  × Reject
                                </button>
                              </div>
                            ) : (
                              <span className="admin-table-muted">
                                {payment.reviewer_username || "Reviewed"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {adminView === "security" && (
          <section className="admin-management-card admin-security-section">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">SECURITY</div>
                <h2>Admin Security</h2>
                <p>Admin routes are server-side protected and tied to the authenticated account.</p>
              </div>
              <span className="admin-security-status">● PROTECTED</span>
            </div>
            <div className="admin-security-summary">
              <div className="admin-security-summary-card protected">
                <span>PROTECTION</span>
                <strong>Protected</strong>
                <small>Authenticated admin routes</small>
              </div>
              <div className="admin-security-summary-card">
                <span>ADMIN ROLE</span>
                <strong>Enabled</strong>
                <small>Server-side role check</small>
              </div>
              <div className="admin-security-summary-card">
                <span>PAYMENTS</span>
                <strong>Review gated</strong>
                <small>Admin approval required</small>
              </div>
              <div className="admin-security-summary-card">
                <span>AUDIT</span>
                <strong>Logging on</strong>
                <small>Requests recorded server-side</small>
              </div>
            </div>

            <div className="admin-security-grid">
              <div className="admin-security-card">
                <span>AUTHENTICATED USER</span>
                <strong>{adminAccess?.user?.username || "Unknown"}</strong>
                <small>{adminAccess?.user?.email || ""}</small>
              </div>
              <div className="admin-security-card">
                <span>ADMIN ACCESS</span>
                <strong>Enabled</strong>
                <small>Server-side role check</small>
              </div>
              <div className="admin-security-card">
                <span>PAYMENT SAFETY</span>
                <strong>Review required</strong>
                <small>Deposits are not credited directly by the browser</small>
              </div>
              <div className="admin-security-card">
                <span>AUDIT TRAIL</span>
                <strong>Enabled</strong>
                <small>Admin requests are logged server-side</small>
              </div>
            </div>
          </section>
        )}

        {adminView === "logs" && (
          <section className="admin-management-card admin-logs-section">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">AUDIT TRAIL</div>
                <h2>Admin Logs</h2>
                <p>Recent server-side Admin Panel requests.</p>
              </div>
            </div>
            <div className="admin-logs-overview">
              {(() => {
                const total = adminLogs.length;
                const successful = adminLogs.filter(
                  (log) => Number(log.status_code || 0) < 400
                ).length;
                const errors = adminLogs.filter(
                  (log) => Number(log.status_code || 0) >= 400
                ).length;
                const uniqueUsers = new Set(
                  adminLogs
                    .map((log) => log.user_id)
                    .filter(Boolean)
                ).size;

                return (
                  <>
                    <div className="admin-log-stat">
                      <span>LOADED EVENTS</span>
                      <strong>{total}</strong>
                      <small>Current result set</small>
                    </div>
                    <div className="admin-log-stat good">
                      <span>SUCCESSFUL</span>
                      <strong>{successful}</strong>
                      <small>HTTP status under 400</small>
                    </div>
                    <div className="admin-log-stat bad">
                      <span>ERRORS</span>
                      <strong>{errors}</strong>
                      <small>HTTP status 400+</small>
                    </div>
                    <div className="admin-log-stat accent">
                      <span>USERS</span>
                      <strong>{uniqueUsers}</strong>
                      <small>Unique users in results</small>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="admin-management-body">
              <div className="admin-management-toolbar">
                <div className="admin-search-wrap">
                  <span>⌕</span>
                  <input
                    value={adminLogSearch}
                    onChange={(event) => setAdminLogSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") loadAdminLogs();
                    }}
                    placeholder="Search username, route or method..."
                  />
                </div>
                <button
                  className="admin-secondary-button"
                  onClick={() => loadAdminLogs()}
                  disabled={adminLogsLoading}
                >
                  {adminLogsLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>
              <div className="admin-activity-table-wrap">
                <table className="admin-activity-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Method</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogs.length === 0 ? (
                      <tr><td colSpan="5" className="admin-table-empty">No audit entries found.</td></tr>
                    ) : (
                      adminLogs.map((log) => (
                        <tr key={log.id}>
                          <td><strong>{log.username || "Unknown"}</strong><small>#{log.user_id || "—"}</small></td>
                          <td className="admin-table-cap">{log.method}</td>
                          <td className="admin-table-muted">{log.path}</td>
                          <td className={Number(log.status_code) < 400 ? "admin-table-positive" : "admin-table-negative"}>{log.status_code}</td>
                          <td className="admin-table-muted">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {adminView === "cases" && (
        <div className="admin-layout">
          {/* CASE LIST */}

          <aside className="admin-case-sidebar">
            <div className="admin-panel-title">
              <div>
                <span>CASES</span>
                <strong>
                  {cases.length} total
                </strong>
              </div>

              <button
                onClick={() =>
                  setShowCreateCase(true)
                }
              >
                +
              </button>
            </div>

            <div className="admin-case-search">
              <span>⌕</span>
              <input
                value={caseSearch}
                onChange={(event) => setCaseSearch(event.target.value)}
                placeholder="Search cases..."
              />
              {caseSearch && (
                <button type="button" onClick={() => setCaseSearch("")}>×</button>
              )}
            </div>

            <div className="admin-case-list">
              {filteredCases.length === 0 ? (
                <div className="admin-case-search-empty">No cases found.</div>
              ) : filteredCases.map((item) => {
                const active =
                  Number(item.id) ===
                  Number(selectedCaseId);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-case-list-item ${
                      active ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelectedCaseId(
                        Number(item.id)
                      )
                    }
                  >
                    <div className="admin-case-mini-icon">
                      🎁
                    </div>

                    <div className="admin-case-list-info">
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {money(
                          item.price_cents
                        )}{" "}
                        ·{" "}
                        {item.reward_count || 0}{" "}
                        rewards
                      </span>
                    </div>

                    <span
                      className={`admin-status-dot ${
                        item.active
                          ? "active"
                          : "inactive"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* MAIN EDITOR */}

          <section className="admin-editor">
            {caseLoading || !selectedCase ? (
              <div className="admin-editor-loading">
                Loading case...
              </div>
            ) : (
              <>
                <div className="admin-editor-top">
                  <div>
                    <div className="admin-eyebrow">
                      CASE EDITOR
                    </div>

                    <h2>
                      {selectedCase.name}
                    </h2>

                    <p>
                      Configure the case and its
                      rewards.
                    </p>
                  </div>

                  <div className="admin-editor-actions">
                    <button
                      type="button"
                      className="admin-secondary-button admin-compact-action"
                      onClick={() => setShowCasePreview(true)}
                      disabled={!selectedCase}
                    >
                      ◉ Preview
                    </button>
                    <button
                      type="button"
                      className="admin-secondary-button admin-compact-action"
                      onClick={duplicateSelectedCase}
                      disabled={saving || !selectedCase}
                    >
                      ⧉ Duplicate
                    </button>
                    <div
                      className={`admin-live-badge ${
                        selectedCase.active
                          ? "live"
                          : "offline"
                      }`}
                    >
                      <span />
                      {selectedCase.active
                        ? "LIVE"
                        : "DISABLED"}
                    </div>
                  </div>
                </div>

                <div className="admin-case-economy">
                  {(() => {
                    const rewardCount = caseItems.length;

                    const expectedRewardCents = caseItems.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.value_cents || 0) *
                          (Number(item.probability || 0) / 100),
                      0
                    );

                    const topReward = [...caseItems].sort(
                      (a, b) =>
                        Number(b.value_cents || 0) -
                        Number(a.value_cents || 0)
                    )[0];

                    const highestOddsReward = [...caseItems].sort(
                      (a, b) =>
                        Number(b.probability || 0) -
                        Number(a.probability || 0)
                    )[0];

                    return (
                      <>
                        <div className="admin-case-economy-card primary">
                          <span>OPENING PRICE</span>
                          <strong>{money(selectedCase.price_cents)}</strong>
                          <small>Customer purchase price</small>
                        </div>

                        <div className="admin-case-economy-card">
                          <span>REWARD POOL</span>
                          <strong>{rewardCount}</strong>
                          <small>{rewardCount === 1 ? "configured reward" : "configured rewards"}</small>
                        </div>

                        <div className="admin-case-economy-card">
                          <span>EXPECTED REWARD</span>
                          <strong>{money(expectedRewardCents)}</strong>
                          <small>Probability-weighted average</small>
                        </div>

                        <div className="admin-case-economy-card">
                          <span>TOP PRIZE</span>
                          <strong>{topReward ? money(topReward.value_cents) : "$0.00"}</strong>
                          <small>{topReward?.name || "No rewards configured"}</small>
                        </div>

                        <div className={`admin-case-economy-card ${oddsValid ? "good" : "warning"}`}>
                          <span>ODDS HEALTH</span>
                          <strong>{totalOdds.toFixed(2)}%</strong>
                          <small>
                            {oddsValid
                              ? `${highestOddsReward ? `${highestOddsReward.name} has the highest configured chance` : "Ready to publish"}`
                              : "Must total exactly 100%"}
                          </small>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* CASE DETAILS */}

                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3>Case Details</h3>
                      <p>
                        Basic information shown to
                        customers.
                      </p>
                    </div>

                    <button
                      className="admin-save-small"
                      onClick={
                        saveCaseDetails
                      }
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : "Save Details"}
                    </button>
                  </div>

                  <div className="admin-form-grid">
                    <label>
                      <span>Case name</span>

                      <input
                        value={
                          editingCase.name
                        }
                        onChange={(event) =>
                          setEditingCase(
                            (current) => ({
                              ...current,
                              name: event.target
                                .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Opening price</span>

                      <div className="admin-money-input">
                        <b>$</b>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            editingCase.price
                          }
                          onChange={(event) =>
                            setEditingCase(
                              (current) => ({
                                ...current,
                                price: event
                                  .target.value,
                              })
                            )
                          }
                        />
                      </div>
                    </label>
                  </div>

                  <div className="admin-status-row">
                    <div>
                      <strong>
                        Case status
                      </strong>

                      <span>
                        {selectedCase.active
                          ? "Customers can open this case."
                          : "This case is hidden from customers."}
                      </span>
                    </div>

                    <button
                      className={
                        selectedCase.active
                          ? "admin-danger-button"
                          : "admin-enable-button"
                      }
                      onClick={
                        toggleCaseStatus
                      }
                      disabled={saving}
                    >
                      {selectedCase.active
                        ? "Disable Case"
                        : "Activate Case"}
                    </button>
                  </div>
                </div>

                {/* ODDS */}

                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3>Rewards & Odds</h3>
                      <p>
                        Configure every possible
                        reward in this case.
                      </p>
                    </div>

                    <div
                      className={`admin-odds-total ${
                        oddsValid
                          ? "valid"
                          : "invalid"
                      }`}
                    >
                      <span>
                        TOTAL ODDS
                      </span>

                      <strong>
                        {totalOdds.toFixed(2)}%
                      </strong>

                      <small>
                        {oddsValid
                          ? "✓ Valid"
                          : `${oddsDifference > 0 ? "+" : ""}${oddsDifference.toFixed(
                              2
                            )}% needed`}
                      </small>
                    </div>
                  </div>


                  <div className="admin-reward-toolbar">
                    <div className="admin-reward-search">
                      <span>⌕</span>
                      <input
                        value={rewardSearch}
                        onChange={(event) => setRewardSearch(event.target.value)}
                        placeholder="Search rewards..."
                      />
                      {rewardSearch && (
                        <button type="button" onClick={() => setRewardSearch("")}>×</button>
                      )}
                    </div>
                    <div className="admin-reward-tools">
                      <button type="button" className="admin-tool-button" onClick={distributeOddsEvenly} disabled={!caseItems.length || saving}>
                        Distribute evenly
                      </button>
                      <span>{filteredCaseItems.length} of {caseItems.length} rewards</span>
                    </div>
                  </div>

                  <div className="admin-reward-table">
                    <div
                      className="admin-reward-header"
                      style={{
                        gridTemplateColumns:
                          "minmax(280px, 1.8fr) 105px minmax(180px, 1.15fr) 92px 98px 66px",
                      }}
                    >
                      <span>REWARD</span>
                      <span>RARITY</span>
                      <span>IMAGE</span>
                      <span>VALUE</span>
                      <span>ODDS</span>
                      <span />
                    </div>

                    {caseItems.length === 0 ? (
                      <div className="admin-empty-rewards">
                        <div>🎁</div>

                        <strong>
                          No rewards yet
                        </strong>

                        <span>
                          Add rewards to this case
                          to begin configuring
                          its odds.
                        </span>
                      </div>
                    ) : (
                      filteredCaseItems.map((item) => (
                        <div
                          className={`admin-reward-row ${rarityClass(
                            item.rarity
                          )}`}
                          key={item.id}
                          style={{
                            gridTemplateColumns:
                              "minmax(280px, 1.8fr) 105px minmax(180px, 1.15fr) 92px 98px 66px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            className="admin-reward-name"
                            style={{
                              minWidth: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <RewardThumbnail item={item} />

                            <div
                              style={{
                                minWidth: 0,
                                overflow: "hidden",
                              }}
                            >
                              <input
                                className="admin-reward-inline-input name"
                                value={item.name || ""}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setCaseItems((current) =>
                                    current.map((currentItem) =>
                                      Number(currentItem.id) === Number(item.id)
                                        ? { ...currentItem, name: value }
                                        : currentItem
                                    )
                                  );
                                }}
                              />

                              <span>
                                Item #{item.id}
                              </span>
                            </div>
                          </div>

                          <div>
                            <select
                              className={`admin-rarity-select ${rarityClass(item.rarity)}`}
                              value={item.rarity}
                              onChange={(event) => {
                                const value = event.target.value;
                                setCaseItems((current) =>
                                  current.map((currentItem) =>
                                    Number(currentItem.id) === Number(item.id)
                                      ? { ...currentItem, rarity: value }
                                      : currentItem
                                  )
                                );
                              }}
                            >
                              {RARITIES.map((rarity) => (
                                <option key={rarity} value={rarity}>{rarity}</option>
                              ))}
                            </select>
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                minWidth: "34px",
                                borderRadius: "8px",
                                border: "1px solid rgba(255,255,255,0.08)",
                                background:
                                  "rgba(255,255,255,0.025)",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                  }}
                                  onError={(event) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    opacity: 0.35,
                                    fontSize: "13px",
                                  }}
                                >
                                  IMG
                                </span>
                              )}
                            </div>

                            <input
                              type="url"
                              placeholder="Paste image URL"
                              value={item.image_url || ""}
                              onChange={(event) => {
                                const value =
                                  event.target.value;

                                setCaseItems((current) =>
                                  current.map(
                                    (currentItem) =>
                                      Number(
                                        currentItem.id
                                      ) ===
                                      Number(item.id)
                                        ? {
                                            ...currentItem,
                                            image_url:
                                              value,
                                          }
                                        : currentItem
                                  )
                                );
                              }}
                              style={{
                                width: "100%",
                                minWidth: 0,
                                height: "34px",
                                padding: "0 9px",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>

                          <div className="admin-reward-value-input">
                            <span>$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={(Number(item.value_cents || 0) / 100).toFixed(2)}
                              onChange={(event) => {
                                const value = event.target.value;
                                setCaseItems((current) =>
                                  current.map((currentItem) =>
                                    Number(currentItem.id) === Number(item.id)
                                      ? { ...currentItem, value_cents: Math.round(Number(value || 0) * 100) }
                                      : currentItem
                                  )
                                );
                              }}
                            />
                          </div>

                          <div className="admin-odds-input">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                item.probability
                              }
                              onChange={(event) =>
                                updateProbability(
                                  item.id,
                                  event.target
                                    .value
                                )
                              }
                            />

                            <span>%</span>
                          </div>

                          <div className="admin-reward-actions">
                            <button
                              title="Save this reward"
                              onClick={() =>
                                saveReward(item)
                              }
                              disabled={saving}
                            >
                              ✓
                            </button>

                            <button
                              title="Remove reward"
                              className="remove"
                              onClick={() =>
                                removeReward(item)
                              }
                              disabled={saving}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="admin-reward-footer">
                    <button
                      className="admin-add-reward"
                      onClick={() =>
                        setShowAddReward(true)
                      }
                    >
                      + Add Reward
                    </button>

                    <button
                      className="admin-primary-button"
                      onClick={
                        saveAllRewards
                      }
                      disabled={
                        saving ||
                        caseItems.length === 0 ||
                        !oddsValid
                      }
                    >
                      {saving
                        ? "Saving..."
                        : "Save All Odds"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
        )}
        </main>
      </div>

      {/* CASE PREVIEW */}

      {showCasePreview && selectedCase && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setShowCasePreview(false)}
        >
          <div
            className="admin-case-preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="admin-modal-close"
              onClick={() => setShowCasePreview(false)}
            >
              ×
            </button>

            <div className="admin-eyebrow">CUSTOMER PREVIEW</div>
            <h2>{selectedCase.name}</h2>
            <p>Exactly how the case information and reward pool will be presented before opening.</p>

            <div className="admin-preview-case-card">
              <div className="admin-preview-case-art">🎁</div>
              <div className="admin-preview-case-info">
                <span>OPENING PRICE</span>
                <strong>{money(selectedCase.price_cents)}</strong>
                <div className="admin-preview-meta">
                  <span>{caseItems.length} rewards</span>
                  <span>{oddsValid ? "100% odds" : `${totalOdds.toFixed(2)}% odds`}</span>
                  <span className={selectedCase.active ? "good" : "bad"}>{selectedCase.active ? "Live" : "Disabled"}</span>
                </div>
              </div>
            </div>

            <div className="admin-preview-rewards">
              {caseItems.map((item) => (
                <div className={`admin-preview-reward ${rarityClass(item.rarity)}`} key={item.id}>
                  <RewardThumbnail item={item} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.rarity} · {money(item.value_cents)}</span>
                  </div>
                  <b>{Number(item.probability || 0).toFixed(2)}%</b>
                </div>
              ))}
            </div>

            <div className="admin-preview-footer">
              <span>{oddsValid ? "✓ Odds are ready to publish" : "⚠ Odds must total exactly 100% before activation"}</span>
              <button className="admin-primary-button" onClick={() => setShowCasePreview(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CASE */}

      {showCreateCase && (
        <div
          className="admin-modal-backdrop"
          onClick={() =>
            !saving &&
            setShowCreateCase(false)
          }
        >
          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="admin-modal-close"
              onClick={() =>
                !saving &&
                setShowCreateCase(false)
              }
            >
              ×
            </button>

            <div className="admin-eyebrow">
              NEW CASE
            </div>

            <h2>Create Case</h2>

            <p>
              Create a new case before adding its
              rewards.
            </p>

            <form
              onSubmit={createCase}
              className="admin-modal-form"
            >
              <label>
                <span>Case name</span>

                <input
                  autoFocus
                  value={newCase.name}
                  placeholder="e.g. Neon Case"
                  onChange={(event) =>
                    setNewCase(
                      (current) => ({
                        ...current,
                        name: event.target
                          .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>Opening price</span>

                <div className="admin-money-input">
                  <b>$</b>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newCase.price}
                    placeholder="9.99"
                    onChange={(event) =>
                      setNewCase(
                        (current) => ({
                          ...current,
                          price: event.target
                            .value,
                        })
                      )
                    }
                  />
                </div>
              </label>

              <button
                className="admin-primary-button admin-modal-submit"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Case"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ITEM */}

      {showCreateItem && (
        <div
          className="admin-modal-backdrop"
          onClick={() =>
            !saving &&
            setShowCreateItem(false)
          }
        >
          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="admin-modal-close"
              onClick={() =>
                !saving &&
                setShowCreateItem(false)
              }
            >
              ×
            </button>

            <div className="admin-eyebrow">
              NEW REWARD
            </div>

            <h2>Create Reward</h2>

            <p>
              Create an item that can later be
              added to any case.
            </p>

            <form
              onSubmit={createItem}
              className="admin-modal-form"
            >
              <label>
                <span>Reward name</span>

                <input
                  autoFocus
                  value={newItem.name}
                  placeholder="e.g. Ruby Crystal"
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        name: event.target
                          .value,
                      })
                    )
                  }
                />
              </label>

              <label>
                <span>Rarity</span>

                <select
                  value={newItem.rarity}
                  onChange={(event) =>
                    setNewItem(
                      (current) => ({
                        ...current,
                        rarity:
                          event.target.value,
                      })
                    )
                  }
                >
                  {RARITIES.map(
                    (rarity) => (
                      <option
                        key={rarity}
                        value={rarity}
                      >
                        {rarity}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>Item value</span>

                <div className="admin-money-input">
                  <b>$</b>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.value}
                    placeholder="25.00"
                    onChange={(event) =>
                      setNewItem(
                        (current) => ({
                          ...current,
                          value: event.target
                            .value,
                        })
                      )
                    }
                  />
                </div>
              </label>

              <label>
                <span>Image URL</span>

                <input
                  type="url"
                  value={newItem.imageUrl}
                  placeholder="https://example.com/reward.png"
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                />
              </label>

              {newItem.imageUrl.trim() && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 0",
                  }}
                >
                  <img
                    src={newItem.imageUrl}
                    alt="Reward preview"
                    style={{
                      width: "56px",
                      height: "56px",
                      objectFit: "contain",
                      borderRadius: "10px",
                    }}
                  />
                  <span style={{ opacity: 0.7 }}>Image preview</span>
                </div>
              )}

              <button
                className="admin-primary-button admin-modal-submit"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Reward"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD REWARD */}

      {showAddReward && (
        <div
          className="admin-modal-backdrop"
          onClick={() =>
            !saving &&
            setShowAddReward(false)
          }
        >
          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="admin-modal-close"
              onClick={() =>
                !saving &&
                setShowAddReward(false)
              }
            >
              ×
            </button>

            <div className="admin-eyebrow">
              CASE REWARD
            </div>

            <h2>Add Reward</h2>

            <p>
              Add an existing reward to{" "}
              <strong>
                {selectedCase?.name}
              </strong>
              .
            </p>

            {availableItems.length === 0 ? (
              <div className="admin-no-items">
                <div>🎁</div>

                <strong>
                  No available rewards
                </strong>

                <span>
                  Every existing reward is already
                  attached to this case.
                </span>

                <button
                  className="admin-secondary-button"
                  onClick={() => {
                    setShowAddReward(false);
                    setShowCreateItem(true);
                  }}
                >
                  + Create Reward
                </button>
              </div>
            ) : (
              <form
                onSubmit={addReward}
                className="admin-modal-form"
              >
                <label>
                  <span>Reward</span>

                  <select
                    value={
                      rewardForm.itemId
                    }
                    onChange={(event) =>
                      setRewardForm(
                        (current) => ({
                          ...current,
                          itemId:
                            event.target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="">
                      Select reward
                    </option>

                    {availableItems.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name} ·{" "}
                          {item.rarity} ·{" "}
                          {money(
                            item.value_cents
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>Drop odds</span>

                  <div className="admin-percent-input">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        rewardForm.probability
                      }
                      placeholder="5.00"
                      onChange={(event) =>
                        setRewardForm(
                          (current) => ({
                            ...current,
                            probability:
                              event.target
                                .value,
                          })
                        )
                      }
                    />

                    <b>%</b>
                  </div>
                </label>

                <button
                  className="admin-primary-button admin-modal-submit"
                  disabled={saving}
                >
                  {saving
                    ? "Adding..."
                    : "Add Reward"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {adminInventoryBulkModalOpen && selectedUser && (
        <div className="admin-modal-backdrop" onMouseDown={() => !adminInventoryBulkWorking && setAdminInventoryBulkModalOpen(false)}>
          <div
            className="admin-modal admin-bulk-sell-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-bulk-remove-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <div className="admin-eyebrow">BULK INVENTORY ACTION</div>
                <h3 id="admin-bulk-remove-title">Remove selected items?</h3>
              </div>
              {!adminInventoryBulkWorking && (
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setAdminInventoryBulkModalOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>

            <div className="admin-bulk-modal-summary">
              <div><span>ITEMS</span><strong>{selectedInventoryItems.length}</strong></div>
              <div><span>TOTAL VALUE</span><strong>{money(selectedInventoryValue)}</strong></div>
              <div><span>ACCOUNT</span><strong>{selectedUser.username}</strong></div>
            </div>

            <p className="admin-bulk-modal-copy">
              This will permanently remove the selected inventory items from this user's active inventory. Each removal will be recorded separately in Admin History.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setAdminInventoryBulkModalOpen(false)}
                disabled={adminInventoryBulkWorking}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-danger-button"
                onClick={bulkRemoveInventoryItems}
                disabled={adminInventoryBulkWorking || selectedInventoryItems.length === 0}
              >
                {adminInventoryBulkWorking ? "Removing..." : `Remove ${selectedInventoryItems.length} item${selectedInventoryItems.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;