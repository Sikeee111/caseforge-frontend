import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

const getPaymentDetails = (payment) => {
  const note = String(payment?.note || "").trim();

  let parsed = null;

  if (note) {
    try {
      const candidate = JSON.parse(note);

      if (
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate)
      ) {
        parsed = candidate;
      }
    } catch {
      parsed = null;
    }
  }

  const network =
    parsed?.network ||
    parsed?.withdrawNetwork ||
    parsed?.currencyNetwork ||
    parsed?.payCurrency ||
    parsed?.currency ||
    null;

  const address =
    parsed?.address ||
    parsed?.walletAddress ||
    parsed?.withdrawAddress ||
    parsed?.withdrawalAddress ||
    parsed?.receivingAddress ||
    null;

  const networkFromText =
    note.match(
      /(?:network|currency|crypto network)\s*[:=\-]\s*([^,;|]+)/i
    )?.[1]?.trim() || null;

  const addressFromText =
    note.match(
      /(?:wallet address|withdrawal address|withdraw address|receiving address|address)\s*[:=]\s*([A-Za-z0-9_-]{20,120})/i
    )?.[1]?.trim() || null;

  const trc20Address =
    note.match(/T[1-9A-HJ-NP-Za-km-z]{33}/)?.[0] || null;

  return {
    network:
      network ||
      networkFromText ||
      (note.match(/USDT\s*[-·]\s*TRC[- ]?20/i)?.[0] || null),
    address:
      address ||
      addressFromText ||
      trc20Address ||
      null,
    rawNote: note,
  };
};

const rarityIcon = (rarity) =>
  rarity === "Secret"
    ? "☄"
    : rarity === "Legendary"
    ? "👑"
    : rarity === "Epic"
    ? "◆"
    : "◇";


const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

async function uploadRewardImage(file) {
  if (!file) return null;

  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please use a PNG, JPG or WEBP image.");
  }

  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });

  const response = await apiFetch(`${API}/api/admin/upload-image`, {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      dataUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload image");
  }

  return data.imageUrl;
}

function ImageDropzone({
  value,
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);

  const chooseFile = async (file) => {
    if (!file || disabled || uploading) return;

    setLocalError("");

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setLocalError(
        "Please select a PNG, JPG or WEBP image."
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setLocalError(
        "Image must be smaller than 5 MB."
      );
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadRewardImage(file);

      if (!imageUrl) {
        throw new Error(
          "The server did not return an image URL."
        );
      }

      onChange(imageUrl);
    } catch (error) {
      console.error(
        "Image upload failed:",
        error
      );

      setLocalError(
        error?.message ||
          "Image upload failed."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const openFilePicker = () => {
    if (
      disabled ||
      uploading ||
      !inputRef.current
    ) {
      return;
    }

    inputRef.current.click();
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={
          disabled || uploading ? -1 : 0
        }
        className={`admin-image-dropzone${
          dragging ? " is-dragging" : ""
        }${value ? " has-image" : ""}`}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" ||
              event.key === " ") &&
            !disabled &&
            !uploading
          ) {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();

          if (!disabled && !uploading) {
            setDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();

          if (!disabled && !uploading) {
            setDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();

          if (
            event.currentTarget ===
            event.target
          ) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();

          setDragging(false);

          if (
            disabled ||
            uploading
          ) {
            return;
          }

          const file =
            event.dataTransfer.files?.[0];

          void chooseFile(file);
        }}
        style={{
          position: "relative",
          minHeight: "150px",
          border:
            "1px dashed rgba(168, 124, 255, 0.55)",
          borderRadius: "16px",
          padding: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor:
            disabled || uploading
              ? "default"
              : "pointer",
          background: dragging
            ? "rgba(154, 108, 255, 0.12)"
            : "rgba(255,255,255,0.02)",
          transition: "0.2s ease",
          overflow: "hidden",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          disabled={
            disabled || uploading
          }
          onChange={(event) => {
            const file =
              event.target.files?.[0];

            void chooseFile(file);
          }}
        />

        {uploading ? (
          <div>
            <strong>
              Uploading image...
            </strong>

            <div
              style={{
                opacity: 0.6,
                marginTop: "6px",
                fontSize: "13px",
              }}
            >
              Please wait
            </div>
          </div>
        ) : value ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              width: "100%",
            }}
          >
            <img
              src={value}
              alt="Reward preview"
              style={{
                width: "82px",
                height: "82px",
                objectFit: "contain",
                flexShrink: 0,
              }}
              onError={() => {
                setLocalError(
                  "The uploaded image could not be displayed."
                );
              }}
            />

            <div
              style={{
                textAlign: "left",
              }}
            >
              <strong>
                Image uploaded
              </strong>

              <div
                style={{
                  opacity: 0.6,
                  marginTop: "5px",
                  fontSize: "13px",
                }}
              >
                Click or drag another image
                here to replace it
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: "30px",
                marginBottom: "8px",
              }}
            >
              🖼️
            </div>

            <strong>
              Drag & drop an image here
            </strong>

            <div
              style={{
                opacity: 0.6,
                marginTop: "6px",
                fontSize: "13px",
              }}
            >
              or click to browse · PNG,
              JPG or WEBP · Max 5 MB
            </div>
          </div>
        )}
      </div>

      {localError && (
        <div
          style={{
            color: "#ff7d9c",
            fontSize: "13px",
            marginTop: "8px",
          }}
        >
          {localError}
        </div>
      )}
    </div>
  );
}

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
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState(null);
  const [adminView, setAdminView] = useState("dashboard");
  const [assetSearch, setAssetSearch] = useState("");
  const [assetRarity, setAssetRarity] = useState("all");
  const [selectedAssetIds, setSelectedAssetIds] = useState(() => new Set());
  const [assetBulkWorking, setAssetBulkWorking] = useState(false);
  const [assetBulkResult, setAssetBulkResult] = useState(null);
  const [showEditAsset, setShowEditAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
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
  const [brainrotDeposits, setBrainrotDeposits] = useState([]);
  const [brainrotDepositsLoading, setBrainrotDepositsLoading] = useState(false);
  const [brainrotDepositStatus, setBrainrotDepositStatus] = useState("pending");
  const [brainrotDepositSearch, setBrainrotDepositSearch] = useState("");
  const [brainrotDepositDrafts, setBrainrotDepositDrafts] = useState({});
  const [adminPaymentsLoading, setAdminPaymentsLoading] = useState(false);
  const [adminPaymentStatus, setAdminPaymentStatus] = useState("pending");
  const [adminPaymentSearch, setAdminPaymentSearch] = useState("");
  const [adminItemWithdrawals, setAdminItemWithdrawals] = useState([]);
  const [adminItemWithdrawalsLoading, setAdminItemWithdrawalsLoading] = useState(false);
  const [adminItemWithdrawalStatus, setAdminItemWithdrawalStatus] = useState("pending");
  const [adminItemWithdrawalSearch, setAdminItemWithdrawalSearch] = useState("");
  const [adminItemWithdrawalActionId, setAdminItemWithdrawalActionId] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminLogsLoading, setAdminLogsLoading] = useState(false);
  const [adminLogSearch, setAdminLogSearch] = useState("");
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [balanceAdjustmentMode, setBalanceAdjustmentMode] = useState("add");
  const [balanceAdjusting, setBalanceAdjusting] = useState(false);
  const [adminRoleUpdating, setAdminRoleUpdating] = useState(false);
  const [creatorCodeForm, setCreatorCodeForm] = useState("");
  const [creatorManaging, setCreatorManaging] = useState(false);
  const [creatorStatusUpdating, setCreatorStatusUpdating] = useState(false);
  const [creators, setCreators] = useState([]);
const [creatorsLoading, setCreatorsLoading] = useState(false);
const [creatorSearch, setCreatorSearch] = useState("");
const [creatorStatusFilter, setCreatorStatusFilter] = useState("all");
const [creatorCommissionUpdating, setCreatorCommissionUpdating] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedCreatorLoading, setSelectedCreatorLoading] = useState(false);
  const [creatorPromoteUserId, setCreatorPromoteUserId] = useState("");
  const [creatorPromoteCode, setCreatorPromoteCode] = useState("");
  const [creatorPromoting, setCreatorPromoting] = useState(false);
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
  imageUrl: "",
});

  const [caseSearch, setCaseSearch] = useState("");
  const [rewardSearch, setRewardSearch] = useState("");
  const [showCasePreview, setShowCasePreview] = useState(false);
  const [featuredSavingId, setFeaturedSavingId] = useState(null);
  const [featuredOrderSaving, setFeaturedOrderSaving] = useState(false);

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

  const featuredCases = useMemo(
    () =>
      [...cases]
        .filter(
          (item) =>
            item.featured === true ||
            item.featured === 1 ||
            item.featured === "true"
        )
        .sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.featured_order))
            ? Number(a.featured_order)
            : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(Number(b.featured_order))
            ? Number(b.featured_order)
            : Number.MAX_SAFE_INTEGER;

          return (
            aOrder -
            bOrder ||
            Number(a.id) - Number(b.id)
          );
        }),
    [cases]
  );

  const toggleFeaturedCase = async (caseId, nextFeatured) => {
    const numericId = Number(caseId);

    if (
      !Number.isInteger(numericId) ||
      featuredSavingId !== null
    ) {
      return;
    }

    try {
      setFeaturedSavingId(numericId);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `${API}/api/admin/cases/${numericId}/featured`,
        {
          method: "PATCH",
          body: JSON.stringify({
            featured: nextFeatured === true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update featured case"
        );
      }

      await loadCases();

      if (Number(selectedCaseId) === numericId) {
        setSelectedCase((current) =>
          current
            ? {
                ...current,
                ...data,
              }
            : current
        );
      }

      setSuccess(
        data.featured
          ? "Case added to Featured Cases."
          : "Case removed from Featured Cases."
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setFeaturedSavingId(null);
    }
  };

  const saveFeaturedOrder = async (nextOrder) => {
    if (
      !nextOrder.length ||
      featuredOrderSaving
    ) {
      return;
    }

    try {
      setFeaturedOrderSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `${API}/api/admin/cases/featured-order`,
        {
          method: "PATCH",
          body: JSON.stringify({
            caseIds: nextOrder.map((item) =>
              Number(item.id)
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save featured order"
        );
      }

      await loadCases();
      setSuccess("Featured case order saved.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setFeaturedOrderSaving(false);
    }
  };

  const moveFeaturedCase = async (index, direction) => {
    const next = [...featuredCases];
    const target = index + direction;

    if (
      target < 0 ||
      target >= next.length
    ) {
      return;
    }

    [next[index], next[target]] = [
      next[target],
      next[index],
    ];

    await saveFeaturedOrder(next);
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
  imageUrl: data.case.image_url || "",
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
      setAnalyticsUpdatedAt(new Date());
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

  const loadAdminCreators = async (
    search = creatorSearch,
    status = creatorStatusFilter
  ) => {
    setCreatorsLoading(true);
    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status && status !== "all") {
        params.set("status", status);
      }

      const query = params.toString()
        ? `?${params.toString()}`
        : "";

      const response = await apiFetch(
        `${API}/api/admin/creators${query}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load creators"
        );
      }

      setCreators(data.creators || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorsLoading(false);
    }
  };

  const loadAdminCreatorDetails = async (creatorId) => {
    const numericId = Number(creatorId);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return;
    }

    setSelectedCreatorLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators/${numericId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load creator details"
        );
      }

      setSelectedCreator(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSelectedCreatorLoading(false);
    }
  };

  const openAdminCreatorDetails = async (creator) => {
    if (!creator) return;
    setSelectedCreator(null);
    await loadAdminCreatorDetails(creator.id);
  };

  const updateCreatorFromAdmin = async (
    creator,
    nextCode
  ) => {
    const creatorCode = String(
      nextCode || ""
    )
      .trim()
      .toUpperCase();

    if (!creatorCode) {
      setError("Enter a creator code.");
      return;
    }

    if (
      creatorCode.length < 3 ||
      creatorCode.length > 24
    ) {
      setError(
        "Creator code must be between 3 and 24 characters."
      );
      return;
    }

    if (!/^[A-Z0-9_]+$/.test(creatorCode)) {
      setError(
        "Creator code can only contain letters, numbers and underscores."
      );
      return;
    }

    if (
      !window.confirm(
        `Update ${creator.username}'s creator code to "${creatorCode}"?`
      )
    ) {
      return;
    }

    setCreatorManaging(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: Number(creator.userId),
            creatorCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update creator"
        );
      }

      setSuccess(
        `${creator.username}'s creator code is now ${creatorCode}.`
      );

      await loadAdminCreators(
        creatorSearch,
        creatorStatusFilter
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorManaging(false);
    }
  };


  const updateCreatorCommission = async (
    creator,
    nextRate
  ) => {
    const commissionRate = Number(
      nextRate
    );

    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      setError(
        "Commission must be between 0% and 100%."
      );
      return;
    }

    if (
      !window.confirm(
        `Set ${creator.username}'s commission to ${commissionRate}%?`
      )
    ) {
      return;
    }

    setCreatorCommissionUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators/${creator.userId}/commission`,
        {
          method: "PATCH",
          body: JSON.stringify({
            commissionRate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update commission"
        );
      }

      setSuccess(
        `${creator.username}'s commission is now ${data.creator.commissionRate}%.`
      );

      await loadAdminCreators(
        creatorSearch,
        creatorStatusFilter
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorCommissionUpdating(false);
    }
  };

  const toggleCreatorFromAdmin = async (creator) => {
    const nextActive = !creator.active;
    const action = nextActive ? "reactivate" : "deactivate";

    if (
      !window.confirm(
        `${nextActive ? "Reactivate" : "Deactivate"} creator access for ${creator.username}?`
      )
    ) {
      return;
    }

    setCreatorStatusUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators/${creator.userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            active: nextActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update creator status"
        );
      }

      setSuccess(
        nextActive
          ? `${creator.username} is active again.`
          : `Creator access deactivated for ${creator.username}.`
      );

      await loadAdminCreators(
        creatorSearch,
        creatorStatusFilter
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorStatusUpdating(false);
    }
  };

  const promoteExistingUserToCreator = async () => {
    const userId = Number(creatorPromoteUserId);
    const creatorCode = creatorPromoteCode
      .trim()
      .toUpperCase();

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Enter a valid user ID.");
      return;
    }

    if (
      creatorCode.length < 3 ||
      creatorCode.length > 24
    ) {
      setError(
        "Creator code must be between 3 and 24 characters."
      );
      return;
    }

    if (!/^[A-Z0-9_]+$/.test(creatorCode)) {
      setError(
        "Creator code can only contain letters, numbers and underscores."
      );
      return;
    }

    if (
      !window.confirm(
        `Promote user #${userId} to an active creator with code "${creatorCode}"?`
      )
    ) {
      return;
    }

    setCreatorPromoting(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators`,
        {
          method: "POST",
          body: JSON.stringify({
            userId,
            creatorCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to promote user"
        );
      }

      setCreatorPromoteUserId("");
      setCreatorPromoteCode("");

      setSuccess(
        `${data.user?.username || `User #${userId}`} is now an active creator with code ${creatorCode}.`
      );

      await loadAdminCreators(
        creatorSearch,
        creatorStatusFilter
      );
      await loadAdminUsers(adminUsersSearch);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorPromoting(false);
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

  const manageCreatorAccount = async () => {
    if (!selectedUser) return;

    const creatorCode = creatorCodeForm.trim();

    if (!creatorCode) {
      setError("Enter a creator code.");
      return;
    }

    if (creatorCode.length < 3 || creatorCode.length > 24) {
      setError("Creator code must be between 3 and 24 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(creatorCode)) {
      setError(
        "Creator code can only contain letters, numbers and underscores."
      );
      return;
    }

    if (
      !window.confirm(
        `Make ${selectedUser.username} an active creator with code "${creatorCode.toUpperCase()}"?`
      )
    ) {
      return;
    }

    setCreatorManaging(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: Number(selectedUser.id),
            creatorCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create creator account"
        );
      }

      const code = String(
        data.creator?.code ||
          creatorCode
      ).toUpperCase();

      setCreatorCodeForm(code);

      setSelectedUser((current) => ({
        ...current,
        creator_code: code,
        creator_active: true,
      }));

      setAdminUsers((current) =>
        current.map((user) =>
          Number(user.id) === Number(selectedUser.id)
            ? {
                ...user,
                creator_code: code,
                creator_active: true,
              }
            : user
        )
      );

      setSuccess(
        `${selectedUser.username} is now an active creator with code ${code}.`
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorManaging(false);
    }
  };

  const deactivateCreatorAccount = async () => {
    if (!selectedUser) return;

    if (
      !window.confirm(
        `Deactivate creator access for ${selectedUser.username}?`
      )
    ) {
      return;
    }

    setCreatorStatusUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/creators/${selectedUser.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            active: false,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to deactivate creator"
        );
      }

      setSelectedUser((current) => ({
        ...current,
        creator_code:
          data.creator?.code ||
          current.creator_code ||
          "",
        creator_active: false,
      }));

      setAdminUsers((current) =>
        current.map((user) =>
          Number(user.id) === Number(selectedUser.id)
            ? {
                ...user,
                creator_code:
                  data.creator?.code ||
                  user.creator_code ||
                  "",
                creator_active: false,
              }
            : user
        )
      );

      setSuccess(
        `Creator access deactivated for ${selectedUser.username}.`
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreatorStatusUpdating(false);
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

  const loadAdminBrainrotDeposits = async (status = brainrotDepositStatus, search = brainrotDepositSearch) => {
    setBrainrotDepositsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await apiFetch(`${API}/api/admin/brainrot-deposits${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load Brainrot deposits");
      setBrainrotDeposits(data.deposits || []);
      setBrainrotDepositDrafts((current) => {
        const next = { ...current };
        for (const deposit of data.deposits || []) {
          const id = String(deposit.id);
          if (!next[id]) next[id] = { amountCents: Number(deposit.amount_cents || 0), itemsDescription: deposit.items_description || "", staffNote: deposit.staff_note || "" };
        }
        return next;
      });
    } catch (err) { console.error(err); setError(err.message); }
    finally { setBrainrotDepositsLoading(false); }
  };

  const updateBrainrotDepositDraft = (depositId, field, value) => {
    const id = String(depositId);
    setBrainrotDepositDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), [field]: value } }));
  };

  const reviewBrainrotDeposit = async (deposit, action) => {
    if (!deposit?.id) return;
    const draft = brainrotDepositDrafts[String(deposit.id)] || {};
    const amountCents = Number(draft.amountCents || 0);
    if (action === "approve" && (!Number.isInteger(amountCents) || amountCents <= 0)) { setError("Enter the approved Brainrot value before crediting."); return; }
    if (!window.confirm(`Are you sure you want to ${action === "approve" ? "credit" : "reject"} Brainrot deposit #${deposit.id}?`)) return;
    try {
      setSaving(true); setError(""); setSuccess("");
      const response = await apiFetch(`${API}/api/admin/brainrot-deposits/${deposit.id}`, { method: "PATCH", body: JSON.stringify({ action, amountCents: action === "approve" ? amountCents : 0, itemsDescription: draft.itemsDescription || "", staffNote: draft.staffNote || "" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Brainrot deposit review failed");
      setSuccess(action === "approve" ? `Brainrot deposit #${deposit.id} credited with ${money(data.amountCents)}.` : `Brainrot deposit #${deposit.id} rejected.`);
      await Promise.all([loadAdminBrainrotDeposits(), loadAdminActivity()]);
    } catch (err) { console.error(err); setError(err.message); }
    finally { setSaving(false); }
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

  const label =
    action === "approve"
      ? "process this withdrawal"
      : "reject this payment request";

  if (
    !window.confirm(
      `Are you sure you want to ${label}?`
    )
  ) {
    return;
  }

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await apiFetch(
      `${API}/api/admin/payments/${paymentId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          action,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Payment review failed"
      );
    }

    /*
     * Withdrawal payouts may require
     * NOWPayments 2FA before CaseX can
     * mark the withdrawal as completed.
     */
    if (
      action === "approve" &&
      data.requires2FA
    ) {
      const verificationCode =
        window.prompt(
          "Enter your NOWPayments 2FA verification code:"
        );

      if (!verificationCode) {
        setSuccess(
          `Payment #${paymentId} payout created. 2FA verification is still required.`
        );
        return;
      }

      const verifyResponse =
        await apiFetch(
          `${API}/api/admin/payments/${paymentId}/verify`,
          {
            method: "POST",
            body: JSON.stringify({
              verificationCode:
                verificationCode.trim(),
            }),
          }
        );

      const verifyData =
        await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          verifyData.error ||
            "NOWPayments verification failed"
        );
      }

      setSuccess(
        `Payment #${paymentId} withdrawal processed successfully.`
      );
    } else {
      setSuccess(
        `Payment #${paymentId} ${data.status}.`
      );
    }

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

  const loadAdminItemWithdrawals = async (
    status = adminItemWithdrawalStatus,
    search = adminItemWithdrawalSearch
  ) => {
    setAdminItemWithdrawalsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await apiFetch(`${API}/api/admin/withdrawals${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load item withdrawals");
      }

      setAdminItemWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminItemWithdrawalsLoading(false);
    }
  };

  const reviewAdminItemWithdrawal = async (withdrawalId, action) => {
    if (!withdrawalId) return;

    const withdrawal = adminItemWithdrawals.find(
      (item) => Number(item.id) === Number(withdrawalId)
    );

    if (!withdrawal) return;

const reference = withdrawal.reference;

const message =
  action === "complete"
    ? `Mark ${reference} as delivered?\n\nThis should only be done after you manually deliver ${withdrawal.item_name} in-game.`
    : `Cancel ${reference}?\n\nThe item will be returned to the user's inventory.`;

    if (!window.confirm(message)) return;

    setAdminItemWithdrawalActionId(Number(withdrawalId));
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(`${API}/api/admin/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal review failed");
      }

setSuccess(
  action === "complete"
    ? `${reference} marked as delivered.`
    : `${reference} cancelled and returned to the user's inventory.`
);

      await Promise.all([
        loadAdminItemWithdrawals(),
        loadAdminActivity(),
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setAdminItemWithdrawalActionId(null);
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
          loadAdminBrainrotDeposits(),
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
  | Live analytics refresh
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => window.clearInterval(interval);
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
  imageUrl: editingCase.imageUrl.trim() || null,
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
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      setError(`Invalid odds for ${item.name}.`);
      return;
    }
    try {
      setSaving(true); setError(""); setSuccess("");
      const response = await apiFetch(`${API}/api/admin/case-items`, {
        method: "POST",
        body: JSON.stringify({ caseId: Number(selectedCase.id), itemId: Number(item.id), probability }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to save ${item.name}`);
      await loadCase(selectedCase.id);
      setSuccess(`${item.name} odds saved successfully.`);
    } catch (err) { console.error(err); setError(err.message); }
    finally { setSaving(false); }
  };


  /*
  |--------------------------------------------------------------------------
  | Save every reward
  |--------------------------------------------------------------------------
  */

  const saveAllRewards = async () => {
    if (!selectedCase) return;
    if (!oddsValid) {
      setError(`Odds must total 100%. Current total is ${totalOdds.toFixed(2)}%.`);
      return;
    }
    try {
      setSaving(true); setError(""); setSuccess("");
      for (const item of caseItems) {
        const probability = Number(item.probability);
        if (!Number.isFinite(probability) || probability < 0 || probability > 100) throw new Error(`Invalid odds for ${item.name}.`);
        const response = await apiFetch(`${API}/api/admin/case-items`, {
          method: "POST",
          body: JSON.stringify({ caseId: Number(selectedCase.id), itemId: Number(item.id), probability }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Failed to save ${item.name}`);
      }
      await loadCase(selectedCase.id);
      setSuccess("All reward odds saved successfully.");
    } catch (err) { console.error(err); setError(err.message); }
    finally { setSaving(false); }
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
  | Case Assets management
  |--------------------------------------------------------------------------
  */

  const filteredAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || String(item.name || "").toLowerCase().includes(query) || String(item.id || "").includes(query);
      const matchesRarity = assetRarity === "all" || item.rarity === assetRarity;
      return matchesSearch && matchesRarity;
    });
  }, [items, assetSearch, assetRarity]);

  const selectedAssets = useMemo(() => {
    return items.filter((item) => selectedAssetIds.has(Number(item.id)));
  }, [items, selectedAssetIds]);

  const allVisibleAssetsSelected =
    filteredAssets.length > 0 &&
    filteredAssets.every((item) => selectedAssetIds.has(Number(item.id)));

  const toggleAssetSelection = (assetId) => {
    const numericId = Number(assetId);
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      if (next.has(numericId)) next.delete(numericId);
      else next.add(numericId);
      return next;
    });
  };

  const selectAllVisibleAssets = () => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      filteredAssets.forEach((item) => next.add(Number(item.id)));
      return next;
    });
  };

  const clearAssetSelection = () => setSelectedAssetIds(new Set());

  const bulkDeleteAssets = async () => {
  if (selectedAssets.length === 0) return;

  const confirmed = window.confirm(
    `Delete ${selectedAssets.length} selected asset${
      selectedAssets.length === 1 ? "" : "s"
    }?\n\nAssets that are still used by a case, opening history, inventory, or admin history will be protected.`
  );

  if (!confirmed) return;

  setAssetBulkWorking(true);
  setError("");
  setSuccess("");
  setAssetBulkResult(null);

  try {
    const response = await apiFetch(
      `${API}/api/admin/items/bulk-delete`,
      {
        method: "POST",
        body: JSON.stringify({
          itemIds: selectedAssets.map((item) =>
            Number(item.id)
          ),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to delete assets"
      );
    }

    const deletedCount = Number(
      data.deletedCount || 0
    );

    const blocked = Array.isArray(data.blocked)
      ? data.blocked
      : [];

    const notFound = Array.isArray(data.notFound)
      ? data.notFound
      : [];

    setSelectedAssetIds(new Set());

    await Promise.all([
      loadItems(),
      selectedCaseId
        ? loadCase(selectedCaseId)
        : Promise.resolve(),
    ]);

    setAssetBulkResult({
      deletedCount,
      blocked,
      notFound,
    });
  } catch (err) {
    console.error(err);

    setError(
      err.message || "Bulk asset deletion failed"
    );
  } finally {
    setAssetBulkWorking(false);
  }
};

  const openEditAsset = (item) => {
    setEditingAsset({ id: Number(item.id), name: item.name || "", rarity: item.rarity || "Common", value: (Number(item.value_cents || 0) / 100).toFixed(2), imageUrl: item.image_url || "" });
    setShowEditAsset(true);
  };

  const saveAsset = async (event) => {
    event.preventDefault();
    if (!editingAsset) return;
    const value = Number(editingAsset.value);
    if (!editingAsset.name.trim() || !RARITIES.includes(editingAsset.rarity) || !Number.isFinite(value) || value < 0) { setError("Enter a valid asset name, rarity and value."); return; }
    try {
      setSaving(true); setError(""); setSuccess("");
      const response = await apiFetch(`${API}/api/admin/items/${editingAsset.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingAsset.name.trim(), rarity: editingAsset.rarity, valueCents: Math.round(value * 100), imageUrl: editingAsset.imageUrl.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update asset");
      await loadItems();
      if (selectedCaseId) await loadCase(selectedCaseId);
      setShowEditAsset(false); setEditingAsset(null);
      setSuccess("Case asset updated successfully.");
    } catch (err) { console.error(err); setError(err.message); }
    finally { setSaving(false); }
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
          Loading CaseX Admin...
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
            <p>Sign in to your CaseX account first, then return to the Admin Panel.</p>
            <a className="admin-primary-button" href="/">Back to CaseX</a>
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
              CASE<span>X</span>
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
              setAdminView("dashboard");
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
           <button
  type="button"
  className="admin-sidebar-item"
  onClick={() => setShowCreateItem(true)}
>
  <span className="admin-sidebar-icon">♔</span>
  <span>Rewards</span>
</button>
            <button type="button" className={adminView === "assets" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => setAdminView("assets")}>
              <span className="admin-sidebar-icon">◆</span><span>Case Assets</span>
            </button>
            <button type="button" className={adminView === "inventory" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("inventory"); if (selectedUserId) { loadAdminInventory(selectedUserId); loadAdminInventoryHistory(selectedUserId); } }}>
              <span className="admin-sidebar-icon">▣</span><span>Inventory</span>
            </button>
            <button type="button" className={adminView === "payments" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("payments"); loadAdminPayments(); }}>
              <span className="admin-sidebar-icon">$</span><span>Payments</span>
            </button>
            <button type="button" className={adminView === "brainrot-deposits" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("brainrot-deposits"); loadAdminBrainrotDeposits(); }}>
              <span className="admin-sidebar-icon">◇</span><span>Brainrot Deposits</span>
            </button>
            <button type="button" className={adminView === "item-withdrawals" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("item-withdrawals"); loadAdminItemWithdrawals(); }}>
              <span className="admin-sidebar-icon">↗</span><span>Item Withdrawals</span>
            </button>
            <button type="button" className={adminView === "users" || adminView === "activity" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("activity"); loadAdminActivity(); }}>
              <span className="admin-sidebar-icon">♟</span><span>Users &amp; Activity</span>
            </button>
            <button type="button" className={adminView === "creators" ? "admin-sidebar-item active" : "admin-sidebar-item"} onClick={() => { setAdminView("creators"); loadAdminCreators(); }}>
              <span className="admin-sidebar-icon">★</span><span>Creators</span>
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
              <div className="admin-analytics-live-meta">
                <span className="admin-analytics-live-dot"></span>
                <span>LIVE · auto-refreshes every 30s</span>
                {analyticsUpdatedAt && (
                  <small>Updated {analyticsUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>
                )}
                <button
                  type="button"
                  className="admin-analytics-refresh"
                  onClick={loadAnalytics}
                  disabled={analyticsLoading}
                >
                  {analyticsLoading ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>
            </div>

            <div className="admin-analytics-grid">
              <div className="admin-stat-card"><div className="admin-stat-icon users">♟</div><div><span>USERS</span><strong>{analytics.overview.users.toLocaleString()}</strong><small>Total registered users</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon openings">▣</div><div><span>OPENINGS</span><strong>{analytics.overview.openings.toLocaleString()}</strong><small>Total case openings</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon revenue">$</div><div><span>CASE REVENUE</span><strong>${(analytics.overview.revenueCents / 100).toFixed(2)}</strong><small>Total from case openings</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon sales">🛒</div><div><span>ITEM SALES</span><strong>${(analytics.overview.itemSalesCents / 100).toFixed(2)}</strong><small>Total from item sales</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon rewards">◆</div><div><span>REWARDS PAID</span><strong>${(analytics.overview.rewardsValueCents / 100).toFixed(2)}</strong><small>Total rewards value</small></div></div>
              <div className="admin-stat-card"><div className="admin-stat-icon active">▰</div><div><span>ACTIVE CASES</span><strong>{analytics.overview.activeCases}</strong><small>Currently active cases</small></div></div>
              <div className="admin-stat-card admin-stat-card-profit"><div className="admin-stat-icon profit">≈</div><div><span>CASE MARGIN</span><strong>${((Number(analytics.overview.revenueCents || 0) - Number(analytics.overview.rewardsValueCents || 0)) / 100).toFixed(2)}</strong><small>Revenue less rewards</small></div></div>
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

            <button type="button" className="admin-command-card brainrot-deposits" onClick={() => { setAdminView("brainrot-deposits"); loadAdminBrainrotDeposits(); }}>
              <span className="admin-command-icon">◇</span><span className="admin-command-copy"><strong>Brainrot Deposits</strong><small>{brainrotDeposits.filter((deposit) => String(deposit.status || "").toLowerCase() === "pending").length} pending submissions</small></span><span className="admin-command-arrow">→</span>
            </button>

            <button
              type="button"
              className="admin-command-card item-withdrawals"
              onClick={() => {
                setAdminView("item-withdrawals");
                loadAdminItemWithdrawals();
              }}
            >
              <span className="admin-command-icon">↗</span>
              <span className="admin-command-copy">
                <strong>Item Withdrawals</strong>
                <small>
                  {adminItemWithdrawals.filter((item) =>
                    String(item.status || "").toLowerCase() === "pending"
                  ).length} pending deliveries
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

        {adminView === "dashboard" && (
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
        )}

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
                            <div className="admin-user-control-card admin-creator-management">
                              <div className="admin-user-control-copy">
                                <span className="admin-user-control-label">CREATOR ACCESS</span>
                                <strong>Creator account</strong>
                                <small>
                                  {selectedUser.creator_active === true
                                    ? `Active creator${selectedUser.creator_code ? ` · ${selectedUser.creator_code}` : ""}.`
                                    : selectedUser.creator_active === false
                                    ? "Creator access is currently deactivated."
                                    : "Assign a creator code to give this account Creator Dashboard access."}
                                </small>
                              </div>

                              <div className="admin-creator-controls">
                                <div className="admin-money-input">
                                  <input
                                    type="text"
                                    value={creatorCodeForm}
                                    onChange={(event) =>
                                      setCreatorCodeForm(
                                        event.target.value
                                          .toUpperCase()
                                          .replace(/[^A-Z0-9_]/g, "")
                                      )
                                    }
                                    placeholder="CREATOR CODE"
                                    maxLength={24}
                                    disabled={creatorManaging || creatorStatusUpdating}
                                  />
                                </div>

                                <div className="admin-creator-action-row">
                                  <button
                                    type="button"
                                    className="admin-primary-button"
                                    onClick={manageCreatorAccount}
                                    disabled={
                                      creatorManaging ||
                                      creatorStatusUpdating ||
                                      !creatorCodeForm.trim()
                                    }
                                  >
                                    {creatorManaging
                                      ? "Saving..."
                                      : selectedUser.creator_active === true
                                      ? "Update creator"
                                      : "Make creator"}
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-danger-button"
                                    onClick={deactivateCreatorAccount}
                                    disabled={
                                      creatorManaging ||
                                      creatorStatusUpdating
                                    }
                                  >
                                    {creatorStatusUpdating
                                      ? "Saving..."
                                      : "Deactivate"}
                                  </button>
                                </div>
                              </div>
                            </div>

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


        {adminView === "creators" && (
          <section className="admin-management-card admin-creators-section">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">CREATOR MANAGEMENT</div>
                <h2>Creators</h2>
                <p>Manage creator accounts, codes and referral performance.</p>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  loadAdminCreators(
                    creatorSearch,
                    creatorStatusFilter
                  )
                }
                disabled={creatorsLoading}
              >
                {creatorsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="admin-management-body">
              <div className="admin-management-toolbar">
                <div className="admin-search-wrap">
                  <span>⌕</span>
                  <input
                    value={creatorSearch}
                    onChange={(event) =>
                      setCreatorSearch(event.target.value)
                    }
                    placeholder="Search creator, email or code..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        loadAdminCreators(
                          creatorSearch,
                          creatorStatusFilter
                        );
                      }
                    }}
                  />
                  {creatorSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatorSearch("");
                        loadAdminCreators(
                          "",
                          creatorStatusFilter
                        );
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={creatorStatusFilter}
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    setCreatorStatusFilter(nextStatus);
                    loadAdminCreators(
                      creatorSearch,
                      nextStatus
                    );
                  }}
                >
                  <option value="all">All creators</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <span className="admin-table-muted">
                  {creators.length} creators
                </span>
              </div>

              <div
                className="admin-management-card"
                style={{
                  marginTop: "18px",
                  padding: "18px",
                  background: "rgba(255,255,255,0.015)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div className="admin-eyebrow">QUICK PROMOTION</div>
                    <h3 style={{ margin: "4px 0 6px" }}>
                      Promote an existing user
                    </h3>
                    <p
                      className="admin-table-muted"
                      style={{ margin: 0 }}
                    >
                      Enter the user's ID from Users &amp; Activity and assign a creator code.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                      flex: "1 1 520px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <input
                      value={creatorPromoteUserId}
                      onChange={(event) =>
                        setCreatorPromoteUserId(
                          event.target.value
                        )
                      }
                      placeholder="User ID"
                      inputMode="numeric"
                      style={{
                        width: "120px",
                      }}
                    />
                    <input
                      value={creatorPromoteCode}
                      onChange={(event) =>
                        setCreatorPromoteCode(
                          event.target.value.toUpperCase()
                        )
                      }
                      placeholder="Creator code"
                      maxLength={24}
                      style={{
                        width: "190px",
                      }}
                    />
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={promoteExistingUserToCreator}
                      disabled={creatorPromoting}
                    >
                      {creatorPromoting
                        ? "Saving..."
                        : "Make creator"}
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="admin-activity-table-wrap"
                style={{ marginTop: "18px" }}
              >
                <table className="admin-activity-table">
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Referred users</th>
                      <th>Cases opened</th>
                      <th>Volume</th>
                      <th>Commission</th>
                      <th>Creator earnings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorsLoading ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="admin-table-empty"
                        >
                          Loading creators...
                        </td>
                      </tr>
                    ) : creators.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="admin-table-empty"
                        >
                          No creators found.
                        </td>
                      </tr>
                    ) : (
                      creators.map((creator) => (
                        <tr
                          key={creator.id}
                          onClick={() =>
                            openAdminCreatorDetails(creator)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              openAdminCreatorDetails(creator);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <strong>{creator.username}</strong>
                            <small>
                              {creator.email}
                              {" · "}
                              #{creator.userId}
                            </small>
                          </td>

                          <td
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              defaultValue={creator.code || ""}
                              maxLength={24}
                              aria-label={`Creator code for ${creator.username}`}
                              style={{
                                width: "150px",
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void updateCreatorFromAdmin(
                                    creator,
                                    event.currentTarget.value
                                  );
                                }
                              }}
                            />
                          </td>

                          <td>
                            <span
                              style={{
                                color: creator.active
                                  ? "#53e59b"
                                  : "#ff7d9c",
                                fontWeight: 700,
                              }}
                            >
                              ●{" "}
                              {creator.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            {creator.referredUsers}
                          </td>

                          <td>
                            {creator.totalCaseOpens}
                          </td>

                          <td className="admin-table-positive">
                            {money(creator.volumeCents)}
                          </td>

<td className="admin-table-money">
  {money(creator.commissionCents)}
</td>

                          <td
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                defaultValue={
                                  creator.commissionRate ?? 5
                                }
                                aria-label={`Commission rate for ${creator.username}`}
                                style={{
                                  width: "72px",
                                }}
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              />
                              <span>%</span>
                              <button
                                type="button"
                                className="admin-secondary-button"
                                disabled={creatorCommissionUpdating}
                                onClick={(event) => {
                                  event.stopPropagation();

                                  const input =
                                    event.currentTarget.parentElement?.querySelector(
                                      'input[type="number"]'
                                    );

                                  void updateCreatorCommission(
                                    creator,
                                    input?.value
                                  );
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </td>

                          <td
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                  openAdminCreatorDetails(creator)
                                }
                              >
                                View details
                              </button>

                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={(event) => {
                                  const row =
                                    event.currentTarget.closest("tr");
                                  const input =
                                    row?.querySelector(
                                      "input[aria-label]"
                                    );

                                  void updateCreatorFromAdmin(
                                    creator,
                                    input?.value ||
                                      creator.code
                                  );
                                }}
                                disabled={creatorManaging}
                              >
                                Save code
                              </button>

                              <button
                                type="button"
                                className={
                                  creator.active
                                    ? "admin-danger-button"
                                    : "admin-primary-button"
                                }
                                onClick={() =>
                                  toggleCreatorFromAdmin(
                                    creator
                                  )
                                }
                                disabled={
                                  creatorStatusUpdating
                                }
                              >
                                {creator.active
                                  ? "Deactivate"
                                  : "Reactivate"}
                              </button>
                            </div>
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

        {selectedCreator && (
          <div
            className="admin-modal-backdrop"
            onMouseDown={() => setSelectedCreator(null)}
          >
            <div
              className="admin-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
              style={{
                width: "min(980px, calc(100vw - 32px))",
                maxHeight: "86vh",
                overflowY: "auto",
              }}
            >
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedCreator(null)}
                aria-label="Close creator details"
              >
                ×
              </button>

              <div className="admin-eyebrow">
                CREATOR PERFORMANCE
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "18px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>
                    {selectedCreator.creator?.username ||
                      "Creator"}
                  </h2>

                  <p
                    className="admin-table-muted"
                    style={{ marginTop: "6px" }}
                  >
                    {selectedCreator.creator?.email || ""}
                    {" · "}
                    Code:{" "}
                    <strong>
                      {selectedCreator.creator?.code || "—"}
                    </strong>
                  </p>
                </div>

                <span
                  style={{
                    color:
                      selectedCreator.creator?.active
                        ? "#53e59b"
                        : "#ff7d9c",
                    fontWeight: 700,
                  }}
                >
                  ●{" "}
                  {selectedCreator.creator?.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "12px",
                  marginTop: "22px",
                }}
              >
                <div className="admin-stat-card" style={{ padding: "16px" }}>
                  <div className="admin-eyebrow">
                    REFERRED USERS
                  </div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "24px",
                      marginTop: "6px",
                    }}
                  >
                    {Number(
                      selectedCreator.stats?.referredUsers ||
                        0
                    )}
                  </strong>
                </div>

                <div className="admin-stat-card" style={{ padding: "16px" }}>
                  <div className="admin-eyebrow">
                    CASES OPENED
                  </div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "24px",
                      marginTop: "6px",
                    }}
                  >
                    {Number(
                      selectedCreator.stats?.totalCaseOpens ||
                        0
                    )}
                  </strong>
                </div>

                <div className="admin-stat-card" style={{ padding: "16px" }}>
                  <div className="admin-eyebrow">
                    TOTAL VOLUME
                  </div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "24px",
                      marginTop: "6px",
                    }}
                  >
                    {money(
                      Number(
                        selectedCreator.stats?.volumeCents ||
                          0
                      )
                    )}
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: "28px", marginBottom: "12px" }}>
                <div className="admin-eyebrow">
                  REFERRAL ACTIVITY
                </div>
                <h3 style={{ margin: "4px 0 0" }}>
                  Referred users
                </h3>
              </div>

              <div className="admin-activity-table-wrap">
                {selectedCreatorLoading ? (
                  <div className="admin-table-empty">
                    Loading creator details...
                  </div>
                ) : (
                  <table className="admin-activity-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Cases opened</th>
                        <th>Volume</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(selectedCreator.referredUsers || [])
                        .length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="admin-table-empty"
                          >
                            No referred users yet.
                          </td>
                        </tr>
                      ) : (
                        selectedCreator.referredUsers.map(
                          (user) => (
                            <tr key={user.id}>
                              <td>
                                <strong>
                                  {user.username}
                                </strong>
                              </td>

                              <td>
                                <small>
                                  {user.email}
                                </small>
                              </td>

                              <td>
                                {user.joinedAt
                                  ? new Date(
                                      user.joinedAt
                                    ).toLocaleDateString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )
                                  : "—"}
                              </td>

                              <td>
                                {Number(
                                  user.caseOpens || 0
                                )}
                              </td>

                              <td className="admin-table-positive">
                                {money(
                                  Number(
                                    user.volumeCents || 0
                                  )
                                )}
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

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

        {adminView === "item-withdrawals" && (
          <section className="admin-management-card admin-item-withdrawals-section">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">ITEM DELIVERY OPERATIONS</div>
                <h2>Item Withdrawals</h2>
                <p>Manually deliver withdrawn brainrots in-game, then mark each request as delivered.</p>
              </div>
              <div className="admin-item-withdrawal-status-tabs">
                {[
                  ["pending", "Pending"],
                  ["completed", "Delivered"],
                  ["cancelled", "Cancelled"],
                  ["all", "All"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={adminItemWithdrawalStatus === value ? "active" : ""}
                    onClick={() => {
                      setAdminItemWithdrawalStatus(value);
                      loadAdminItemWithdrawals(value, adminItemWithdrawalSearch);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-item-withdrawal-overview">
              {(() => {
                const pending = adminItemWithdrawals.filter((item) => item.status === "pending");
                const completed = adminItemWithdrawals.filter((item) => item.status === "completed");
                const cancelled = adminItemWithdrawals.filter((item) => item.status === "cancelled");

                return (
                  <>
                    <div className="admin-item-withdrawal-stat pending">
                      <span>PENDING</span>
                      <strong>{pending.length}</strong>
                      <small>Awaiting delivery</small>
                    </div>
                    <div className="admin-item-withdrawal-stat delivered">
                      <span>DELIVERED</span>
                      <strong>{completed.length}</strong>
                      <small>Completed requests</small>
                    </div>
                    <div className="admin-item-withdrawal-stat cancelled">
                      <span>CANCELLED</span>
                      <strong>{cancelled.length}</strong>
                      <small>Returned to inventory</small>
                    </div>
                    <div className="admin-item-withdrawal-stat total">
                      <span>LOADED</span>
                      <strong>{adminItemWithdrawals.length}</strong>
                      <small>Current view</small>
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
                    value={adminItemWithdrawalSearch}
                    onChange={(event) => setAdminItemWithdrawalSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        loadAdminItemWithdrawals();
                      }
                    }}
                    placeholder="Search Withdrawal Code, user or item..."
                  />
                </div>
                <button
                  className="admin-secondary-button"
                  onClick={() => loadAdminItemWithdrawals()}
                  disabled={adminItemWithdrawalsLoading}
                >
                  {adminItemWithdrawalsLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              <div className="admin-activity-table-wrap">
                <table className="admin-activity-table admin-item-withdrawal-table">
                  <thead>
                    <tr>
                      <th>Withdrawal</th>
                      <th>User</th>
                      <th>Item</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminItemWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-table-empty">
                          {adminItemWithdrawalsLoading ? "Loading withdrawal requests..." : "No item withdrawal requests found."}
                        </td>
                      </tr>
                    ) : (
                      adminItemWithdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td>
                            <span className="admin-item-withdrawal-id">{withdrawal.reference}</span>
                            <small>Inventory #{withdrawal.inventory_id}</small>
                          </td>
                          <td>
                            <strong>{withdrawal.username}</strong>
                            <small>#{withdrawal.user_id}</small>
                          </td>
                          <td>
                            <div className="admin-item-withdrawal-item">
                              {withdrawal.image_url ? (
                                <img src={withdrawal.image_url} alt="" />
                              ) : (
                                <span className="admin-item-withdrawal-item-placeholder">◇</span>
                              )}
                              <div>
                                <strong>{withdrawal.item_name}</strong>
                                <small>{withdrawal.rarity}</small>
                              </div>
                            </div>
                          </td>
                          <td className="admin-table-money">{money(withdrawal.value_cents)}</td>
                          <td>
                            <span className={`admin-item-withdrawal-status ${withdrawal.status}`}>
                              {withdrawal.status === "completed" ? "Delivered" : withdrawal.status}
                            </span>
                          </td>
                          <td className="admin-table-muted">
                            {new Date(withdrawal.created_at).toLocaleString()}
                          </td>
                          <td>
                            {withdrawal.status === "pending" ? (
                              <div className="admin-item-withdrawal-actions">
                                <button
                                  className="admin-item-withdrawal-complete"
                                  onClick={() => reviewAdminItemWithdrawal(withdrawal.id, "complete")}
                                  disabled={adminItemWithdrawalActionId === Number(withdrawal.id)}
                                >
                                  {adminItemWithdrawalActionId === Number(withdrawal.id) ? "Saving..." : "✓ Delivered"}
                                </button>
                                <button
                                  className="admin-item-withdrawal-cancel"
                                  onClick={() => reviewAdminItemWithdrawal(withdrawal.id, "cancel")}
                                  disabled={adminItemWithdrawalActionId === Number(withdrawal.id)}
                                >
                                  × Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="admin-table-muted">
                                {withdrawal.status === "completed" ? "Completed" : "Returned"}
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
                      <th>Destination</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPayments.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="admin-table-empty">No payment requests found.</td>
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
                          <td className="admin-payment-details-cell">
                            {payment.direction === "withdrawal" ? (
                              (() => {
                                const details = getPaymentDetails(payment);

                                return (
                                  <div
                                    style={{
                                      minWidth: "220px",
                                      maxWidth: "280px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        marginBottom: "4px",
                                      }}
                                    >
                                      {details.network || "Network unavailable"}
                                    </div>

                                    <div
                                      title={details.address || details.rawNote || ""}
                                      style={{
                                        fontFamily: "monospace",
                                        fontSize: "11px",
                                        color: "#8f8ca0",
                                        maxWidth: "280px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {details.address ||
                                        details.rawNote ||
                                        "Wallet address unavailable"}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <span className="admin-table-muted">—</span>
                            )}
                          </td>
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

        {adminView === "brainrot-deposits" && (
          <section className="admin-management-card admin-brainrot-deposits-section">
            <div className="admin-management-head">
              <div><div className="admin-eyebrow">MANUAL DEPOSITS</div><h2>Brainrot Deposits</h2><p>Verify what you received in-game, set the approved value, then credit the user's CASEX wallet.</p></div>
              <div className="admin-payment-status-tabs">{[["pending","Pending"],["approved","Approved"],["rejected","Rejected"],["all","All"]].map(([value,label]) => <button key={value} className={brainrotDepositStatus === value ? "active" : ""} onClick={() => { setBrainrotDepositStatus(value); loadAdminBrainrotDeposits(value, brainrotDepositSearch); }}>{label}</button>)}</div>
            </div>
            <div className="admin-management-body">
              <div className="admin-management-toolbar"><div className="admin-search-wrap"><span>⌕</span><input value={brainrotDepositSearch} onChange={(e) => setBrainrotDepositSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadAdminBrainrotDeposits(); }} placeholder="Search user or deposit code..." /></div><button className="admin-secondary-button" onClick={() => loadAdminBrainrotDeposits()} disabled={brainrotDepositsLoading}>{brainrotDepositsLoading ? "Loading..." : "↻ Refresh"}</button></div>
              <div className="admin-activity-table-wrap"><table className="admin-activity-table admin-brainrot-deposits-table"><thead><tr><th>ID</th><th>User</th><th>Deposit Code</th><th>Brainrots Received</th><th>Approved Value</th><th>Status</th><th>Staff Note</th><th>Action</th></tr></thead><tbody>
                {brainrotDeposits.length === 0 ? <tr><td colSpan="8" className="admin-table-empty">No Brainrot deposits found.</td></tr> : brainrotDeposits.map((deposit) => { const id=String(deposit.id); const draft=brainrotDepositDrafts[id] || {}; return <tr key={deposit.id}><td>#{deposit.id}</td><td><strong>{deposit.username}</strong><small>#{deposit.user_id}</small></td><td><code className="admin-brainrot-code">{deposit.deposit_code}</code></td><td>{deposit.status === "pending" ? <textarea className="admin-brainrot-textarea" value={draft.itemsDescription || ""} onChange={(e) => updateBrainrotDepositDraft(deposit.id,"itemsDescription",e.target.value)} placeholder="e.g. Rainbow Garama, Garama..."/> : <span>{deposit.items_description || "—"}</span>}</td><td>{deposit.status === "pending" ? <div className="admin-brainrot-amount-wrap"><span>$</span><input type="number" min="0" step="0.01" value={Number(draft.amountCents || 0)/100} onChange={(e) => updateBrainrotDepositDraft(deposit.id,"amountCents",Math.round(Number(e.target.value || 0)*100))}/></div> : <span className="admin-table-money">{money(deposit.amount_cents)}</span>}</td><td><span className={`admin-payment-status ${deposit.status}`}>{deposit.status}</span></td><td>{deposit.status === "pending" ? <textarea className="admin-brainrot-textarea" value={draft.staffNote || ""} onChange={(e) => updateBrainrotDepositDraft(deposit.id,"staffNote",e.target.value)} placeholder="Optional internal note..."/> : <span className="admin-table-muted">{deposit.staff_note || "—"}</span>}</td><td>{deposit.status === "pending" ? <div className="admin-payment-actions"><button className="admin-payment-approve" onClick={() => reviewBrainrotDeposit(deposit,"approve")} disabled={saving}>✓ Credit</button><button className="admin-payment-reject" onClick={() => reviewBrainrotDeposit(deposit,"reject")} disabled={saving}>× Reject</button></div> : <span className="admin-table-muted">{deposit.reviewer_username || "Reviewed"}</span>}</td></tr>; })}
              </tbody></table></div>
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

        {adminView === "assets" && (
          <section className="admin-management-card">
            <div className="admin-management-head">
              <div>
                <div className="admin-eyebrow">MASTER REWARD CATALOG</div>
                <h2>Case Assets</h2>
                <p>Manage reusable reward assets that can be placed into any case.</p>
              </div>
              <button className="admin-primary-button" onClick={() => { setNewItem({ name: "", rarity: "Common", value: "", imageUrl: "" }); setShowCreateItem(true); }}>+ Add Asset</button>
            </div>
            <div className="admin-management-body">
              <div className="admin-management-toolbar">
                <div className="admin-search-wrap">
                  <span>⌕</span>
                  <input value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} placeholder="Search assets..." />
                  {assetSearch && <button type="button" onClick={() => setAssetSearch("")}>×</button>}
                </div>
                <select value={assetRarity} onChange={(event) => setAssetRarity(event.target.value)}>
                  <option value="all">All rarities</option>
                  {RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
                </select>
                <span className="admin-table-muted">{filteredAssets.length} of {items.length} assets</span>
                {selectedAssetIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={clearAssetSelection}
                      disabled={assetBulkWorking}
                    >
                      Clear ({selectedAssetIds.size})
                    </button>
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={bulkDeleteAssets}
                      disabled={assetBulkWorking}
                    >
                      {assetBulkWorking ? "Deleting..." : `Delete Selected (${selectedAssetIds.size})`}
                    </button>
                  </>
                )}
              </div>
              <div className="admin-activity-table-wrap">
                <table className="admin-activity-table">
                  <thead>
                    <tr>
                      <th className="admin-inventory-checkbox-col">
                        <input
                          type="checkbox"
                          aria-label="Select all visible case assets"
                          checked={allVisibleAssetsSelected}
                          onChange={(event) => {
                            if (event.target.checked) selectAllVisibleAssets();
                            else clearAssetSelection();
                          }}
                        />
                      </th>
                      <th>Asset</th><th>Rarity</th><th>Value</th><th>Asset ID</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.length === 0 ? (
                      <tr><td colSpan="6" className="admin-table-empty">No case assets found.</td></tr>
                    ) : filteredAssets.map((item) => (
                      <tr key={item.id} className={selectedAssetIds.has(Number(item.id)) ? "admin-inventory-row-selected" : ""}>
                        <td className="admin-inventory-checkbox-col">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.name}`}
                            checked={selectedAssetIds.has(Number(item.id))}
                            onChange={() => toggleAssetSelection(item.id)}
                          />
                        </td>
                        <td><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><RewardThumbnail item={item} /><div><strong>{item.name}</strong><small>Reusable case reward</small></div></div></td>
                        <td><span className={rarityClass(item.rarity)}>{item.rarity}</span></td>
                        <td><strong>{money(item.value_cents)}</strong></td>
                        <td className="admin-table-muted">#{item.id}</td>
                        <td><button type="button" className="admin-secondary-button" onClick={() => openEditAsset(item)}>Edit</button></td>
                      </tr>
                    ))}
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

            <div className="admin-featured-case-panel">
              <div className="admin-featured-case-head">
                <div>
                  <span>FEATURED ON HOMEPAGE</span>
                  <strong>
                    {featuredCases.length} selected
                  </strong>
                </div>

                <small>
                  Top 4 appear on the homepage.
                </small>
              </div>

              {featuredCases.length === 0 ? (
                <div className="admin-featured-empty">
                  No featured cases yet. Star a case below to add it.
                </div>
              ) : (
                <div className="admin-featured-list">
                  {featuredCases.map((item, index) => (
                    <div
                      className="admin-featured-row"
                      key={item.id}
                    >
                      <span className="admin-featured-position">
                        {index + 1}
                      </span>

                      <div className="admin-featured-row-info">
                        <strong>{item.name}</strong>
                        <small>
                          {money(item.price_cents)}
                        </small>
                      </div>

                      <div className="admin-featured-row-actions">
                        <button
                          type="button"
                          className="admin-featured-order-button"
                          onClick={() =>
                            moveFeaturedCase(
                              index,
                              -1
                            )
                          }
                          disabled={
                            index === 0 ||
                            featuredOrderSaving
                          }
                          aria-label={`Move ${item.name} up`}
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          className="admin-featured-order-button"
                          onClick={() =>
                            moveFeaturedCase(
                              index,
                              1
                            )
                          }
                          disabled={
                            index ===
                              featuredCases.length - 1 ||
                            featuredOrderSaving
                          }
                          aria-label={`Move ${item.name} down`}
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          className="admin-featured-remove-button"
                          onClick={() =>
                            toggleFeaturedCase(
                              item.id,
                              false
                            )
                          }
                          disabled={
                            featuredSavingId ===
                              Number(item.id) ||
                            featuredOrderSaving
                          }
                          aria-label={`Remove ${item.name} from featured`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-case-list">
              {filteredCases.length === 0 ? (
                <div className="admin-case-search-empty">No cases found.</div>
              ) : filteredCases.map((item) => {
                const active =
                  Number(item.id) ===
                  Number(selectedCaseId);

                const featured =
                  item.featured === true ||
                  item.featured === 1 ||
                  item.featured === "true";

                return (
                  <div
                    key={item.id}
                    className={`admin-case-list-item ${
                      active ? "active" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedCaseId(
                        Number(item.id)
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setSelectedCaseId(
                          Number(item.id)
                        );
                      }
                    }}
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

                    <button
                      type="button"
                      className={`admin-featured-star ${
                        featured ? "active" : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFeaturedCase(
                          item.id,
                          !featured
                        );
                      }}
                      disabled={
                        featuredSavingId ===
                        Number(item.id)
                      }
                      aria-label={
                        featured
                          ? `Remove ${item.name} from featured`
                          : `Add ${item.name} to featured`
                      }
                    >
                      {featured ? "★" : "☆"}
                    </button>

                    <span
                      className={`admin-status-dot ${
                        item.active
                          ? "active"
                          : "inactive"
                      }`}
                    />
                  </div>
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

                    <label>
                      <span>Case Front Image</span>

                      <ImageDropzone
                        value={editingCase.imageUrl}
                        onChange={(imageUrl) =>
                          setEditingCase((current) => ({
                            ...current,
                            imageUrl,
                          }))
                        }
                        disabled={saving}
                        inputId="edit-case-image-picker"
                      />

                      <input
                        type="url"
                        value={editingCase.imageUrl}
                        placeholder="https://example.com/case-image.png"
                        onChange={(event) =>
                          setEditingCase((current) => ({
                            ...current,
                            imageUrl: event.target.value,
                          }))
                        }
                        style={{
                          marginTop: "10px",
                          width: "100%",
                        }}
                      />
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

                  <div className="admin-status-row admin-featured-status-row">
                    <div>
                      <strong>
                        Homepage featured
                      </strong>

                      <span>
                        {selectedCase.featured
                          ? `Shown on the homepage${
                              selectedCase.featured_order
                                ? ` at position ${selectedCase.featured_order}.`
                                : "."
                            }`
                          : "This case is not shown in Featured Cases."}
                      </span>
                    </div>

                    <button
                      className={
                        selectedCase.featured
                          ? "admin-featured-disable-button"
                          : "admin-featured-enable-button"
                      }
                      onClick={() =>
                        toggleFeaturedCase(
                          selectedCase.id,
                          !selectedCase.featured
                        )
                      }
                      disabled={
                        saving ||
                        featuredSavingId ===
                          Number(selectedCase.id)
                      }
                    >
                      {selectedCase.featured
                        ? "Remove Featured"
                        : "Add to Featured"}
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
                              <strong className="admin-reward-inline-input name" style={{ display: "block", padding: "7px 9px" }}>{item.name || "Unnamed asset"}</strong>

                              <span>
                                Item #{item.id}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className={`admin-rarity-select ${rarityClass(item.rarity)}`} style={{ display: "inline-flex", alignItems: "center", minHeight: "34px", padding: "0 9px" }}>{item.rarity}</span>
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

                            <span className="admin-table-muted">{item.image_url ? "Asset image set" : "No image"}</span>
                          </div>

                          <div className="admin-reward-value-input" style={{ justifyContent: "center", minHeight: "34px" }}><span>{money(item.value_cents)}</span></div>

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

      {/* BULK ASSET DELETE RESULT */}

{assetBulkResult && (
  <div
    className="admin-modal-backdrop"
    onClick={() => setAssetBulkResult(null)}
  >
    <div
      className="admin-modal"
      onClick={(event) => event.stopPropagation()}
      style={{
        width: "min(680px, calc(100vw - 32px))",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <button
        className="admin-modal-close"
        onClick={() => setAssetBulkResult(null)}
      >
        ×
      </button>

      <div
        className="admin-eyebrow"
        style={{ marginBottom: "6px" }}
      >
        BULK ASSET CLEANUP
      </div>

      <h2>Deletion Results</h2>

      <p>
        The selected assets have been processed.
        Protected assets were left untouched.
      </p>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "10px",
          margin: "20px 0",
        }}
      >
        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid rgba(74, 222, 128, .18)",
            background:
              "rgba(74, 222, 128, .06)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: ".1em",
              color: "#75e6a0",
              marginBottom: "6px",
            }}
          >
            DELETED
          </div>

          <strong
            style={{
              fontSize: "24px",
              color: "#fff",
            }}
          >
            {assetBulkResult.deletedCount}
          </strong>
        </div>

        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid rgba(255, 180, 80, .18)",
            background:
              "rgba(255, 180, 80, .06)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: ".1em",
              color: "#ffbd72",
              marginBottom: "6px",
            }}
          >
            PROTECTED
          </div>

          <strong
            style={{
              fontSize: "24px",
              color: "#fff",
            }}
          >
            {assetBulkResult.blocked.length}
          </strong>
        </div>

        <div
          style={{
            padding: "14px",
            borderRadius: "12px",
            border:
              "1px solid rgba(148, 163, 184, .18)",
            background:
              "rgba(148, 163, 184, .05)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: ".1em",
              color: "#9ca3af",
              marginBottom: "6px",
            }}
          >
            NOT FOUND
          </div>

          <strong
            style={{
              fontSize: "24px",
              color: "#fff",
            }}
          >
            {assetBulkResult.notFound.length}
          </strong>
        </div>
      </div>

      {/* PROTECTED ASSETS */}

      {assetBulkResult.blocked.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: ".12em",
              color: "#ffbd72",
              marginBottom: "9px",
            }}
          >
            PROTECTED ASSETS
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {assetBulkResult.blocked.map(
              (asset) => (
                <div
                  key={asset.id}
                  style={{
                    padding: "12px",
                    border:
                      "1px solid rgba(255, 180, 80, .14)",
                    borderRadius: "10px",
                    background: "#0e0f15",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <strong
                      style={{
                        color: "#f3f3f7",
                        fontSize: "12px",
                      }}
                    >
                      {asset.name}
                    </strong>

                    <span
                      style={{
                        color: "#777985",
                        fontSize: "10px",
                      }}
                    >
                      #{asset.id}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {(asset.references || []).map(
                      (reference) => (
                        <span
                          key={reference}
                          style={{
                            padding:
                              "4px 7px",
                            borderRadius: "6px",
                            background:
                              "rgba(255, 180, 80, .08)",
                            border:
                              "1px solid rgba(255, 180, 80, .14)",
                            color: "#ffbd72",
                            fontSize: "9px",
                            fontWeight: 800,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {String(reference).replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* NOT FOUND */}

      {assetBulkResult.notFound.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: ".12em",
              color: "#9ca3af",
              marginBottom: "9px",
            }}
          >
            NOT FOUND
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "7px",
            }}
          >
            {assetBulkResult.notFound.map(
              (asset) => (
                <span
                  key={asset.id}
                  style={{
                    padding: "7px 9px",
                    borderRadius: "7px",
                    background:
                      "rgba(148, 163, 184, .06)",
                    border:
                      "1px solid rgba(148, 163, 184, .12)",
                    color: "#9ca3af",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  #{asset.id}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {assetBulkResult.deletedCount > 0 &&
        assetBulkResult.blocked.length === 0 &&
        assetBulkResult.notFound.length === 0 && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background:
                "rgba(74, 222, 128, .06)",
              border:
                "1px solid rgba(74, 222, 128, .14)",
              color: "#75e6a0",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            ✓ All selected assets were deleted
            successfully.
          </div>
        )}

      <div
        className="admin-modal-actions"
        style={{ marginTop: "20px" }}
      >
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setAssetBulkResult(null)}
        >
          Done
        </button>
      </div>
    </div>
  </div>
)}

      {/* EDIT CASE ASSET */}

      {showEditAsset && editingAsset && (
        <div className="admin-modal-backdrop" onClick={() => !saving && setShowEditAsset(false)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => !saving && setShowEditAsset(false)}>×</button>
            <div className="admin-eyebrow">CASE ASSET</div><h2>Edit Asset</h2><p>This master asset can be reused across multiple cases.</p>
            <form onSubmit={saveAsset} className="admin-modal-form">
              <label><span>Asset name</span><input autoFocus value={editingAsset.name} onChange={(event) => setEditingAsset((current) => ({ ...current, name: event.target.value }))} /></label>
              <label><span>Rarity</span><select value={editingAsset.rarity} onChange={(event) => setEditingAsset((current) => ({ ...current, rarity: event.target.value }))}>{RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}</select></label>
              <label><span>Asset value</span><div className="admin-money-input"><b>$</b><input type="number" min="0" step="0.01" value={editingAsset.value} onChange={(event) => setEditingAsset((current) => ({ ...current, value: event.target.value }))} /></div></label>
              <label><span>Reward Image</span></label>
              <ImageDropzone
                value={editingAsset.imageUrl}
                onChange={(imageUrl) =>
                  setEditingAsset((current) => ({ ...current, imageUrl }))
                }
                disabled={saving}
                inputId="edit-asset-image-picker"
              />
              <label><span>Image URL (optional)</span><input type="url" value={editingAsset.imageUrl} placeholder="https://example.com/reward.png" onChange={(event) => setEditingAsset((current) => ({ ...current, imageUrl: event.target.value }))} /></label>
              <button className="admin-primary-button admin-modal-submit" disabled={saving}>{saving ? "Saving..." : "Save Asset"}</button>
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
  <span>Reward Image</span>

  <ImageDropzone
    value={newItem.imageUrl}
    onChange={(imageUrl) =>
      setNewItem((current) => ({
        ...current,
        imageUrl,
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