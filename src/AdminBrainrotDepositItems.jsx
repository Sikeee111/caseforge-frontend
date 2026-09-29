import React, { useEffect, useMemo, useRef, useState } from "react";
import "./admin-brainrot-deposit-items.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const RARITIES = ["Common", "Rare", "Epic", "Legendary", "Secret"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function uploadDepositImage(file) {
  if (!file) throw new Error("Attach an item image.");
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please use a PNG, JPG or WEBP image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
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

  const data = await readJson(response);
  if (!response.ok || !data.imageUrl) {
    throw new Error(data.error || "Image upload failed.");
  }

  return data.imageUrl;
}

function ImagePicker({ preview, disabled, onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const accept = (file) => {
    if (!file || disabled) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      onFile(null, "Please use a PNG, JPG or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onFile(null, "Image must be 5 MB or smaller.");
      return;
    }
    onFile(file, "");
  };

  return (
    <button
      type="button"
      className={`deposit-item-image-picker${dragging ? " is-dragging" : ""}${preview ? " has-image" : ""}`}
      disabled={disabled}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled}
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {preview ? (
        <>
          <img src={preview} alt="" className="deposit-item-image-preview" />
          <span className="deposit-item-image-copy">
            <strong>Image selected</strong>
            <small>Click or drag to replace it.</small>
          </span>
        </>
      ) : (
        <>
          <span className="deposit-item-upload-icon">↑</span>
          <span className="deposit-item-image-copy">
            <strong>Upload Brainrot image</strong>
            <small>PNG, JPG or WEBP · Max 5 MB</small>
          </span>
        </>
      )}
    </button>
  );
}

export default function AdminBrainrotDepositItems() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const [name, setName] = useState("");
  const [rarity, setRarity] = useState("Common");
  const [value, setValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setName("");
    setRarity("Common");
    setValue("");
    setImageFile(null);
    setImagePreview("");
    setActive(true);
    setEditingItem(null);
  };

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/api/admin/brainrot-deposit-items`, {
        cache: "no-store",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to load accepted Brainrots.");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("Accepted Brainrot items load failed:", err);
      setError(err.message || "Failed to load accepted Brainrots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) =>
      !query ||
      [item.name, item.rarity].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [items, search]);

  const openEdit = (item) => {
    setEditingItem(item);
    setName(String(item.name || ""));
    setRarity(String(item.rarity || "Common"));
    setValue((Number(item.value_cents || 0) / 100).toFixed(2));
    setImageFile(null);
    setImagePreview(String(item.image_url || ""));
    setActive(Boolean(item.active));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const imageChanged = (file, message) => {
    setError(message || "");

    if (!file) {
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setImagePreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const save = async (event) => {
    event.preventDefault();

    const cleanName = name.trim();
    const numericValue = Number(value);

    if (!cleanName) {
      setError("Enter a Brainrot name.");
      return;
    }
    if (!RARITIES.includes(rarity)) {
      setError("Choose a valid rarity.");
      return;
    }
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setError("Enter a valid deposit value.");
      return;
    }
    if (!editingItem && !imageFile) {
      setError("Attach an item image.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = String(editingItem?.image_url || "");

      if (imageFile) {
        imageUrl = await uploadDepositImage(imageFile);
      }

      const payload = {
        name: cleanName,
        rarity,
        valueCents: Math.round(numericValue * 100),
        imageUrl: imageUrl || null,
        gameSlug: "steal-a-brainrot",
        active,
      };

      const response = editingItem
        ? await apiFetch(`${API}/api/admin/brainrot-deposit-items/${editingItem.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiFetch(`${API}/api/admin/brainrot-deposit-items`, {
            method: "POST",
            body: JSON.stringify(payload),
          });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to save accepted Brainrot.");
      }

      await load();
      resetForm();
      setSuccess(
        editingItem
          ? `${cleanName} was updated successfully.`
          : `${cleanName} was added to accepted deposits.`
      );
    } catch (err) {
      console.error("Accepted Brainrot save failed:", err);
      setError(err.message || "Failed to save accepted Brainrot.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (
      !window.confirm(
        `Remove ${item.name} from accepted Brainrot deposits?\n\nExisting deposit requests will not be affected.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/admin/brainrot-deposit-items/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove accepted Brainrot.");
      }

      setItems((current) =>
        current.filter((entry) => Number(entry.id) !== Number(item.id))
      );
      setSuccess(`${item.name} was removed from accepted deposits.`);
      if (editingItem && Number(editingItem.id) === Number(item.id)) {
        resetForm();
      }
    } catch (err) {
      console.error("Accepted Brainrot removal failed:", err);
      setError(err.message || "Failed to remove accepted Brainrot.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-management-card admin-brainrot-deposit-items">
      <div className="admin-management-head">
        <div>
          <div className="admin-eyebrow">DEPOSIT CATALOG</div>
          <h2>Accepted Brainrots</h2>
          <p>
            Control which Brainrots users can use as a reference when making manual
            deposits, and set the value your staff should use.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() => void load()}
          disabled={loading || saving}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {(error || success) && (
        <div className={`admin-marketplace-alert ${error ? "error" : "success"}`}>
          <strong>{error ? "Error" : "Saved"}</strong>
          <span>{error || success}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-brainrot-deposit-items-layout">
        <form className="admin-management-card admin-brainrot-deposit-form" onSubmit={save}>
          <div className="admin-brainrot-deposit-form-head">
            <div>
              <div className="admin-eyebrow">
                {editingItem ? "EDIT ITEM" : "ADD ITEM"}
              </div>
              <h3>{editingItem ? "Edit accepted Brainrot" : "Add accepted Brainrot"}</h3>
            </div>

            {editingItem && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>

          <ImagePicker
            preview={imagePreview}
            disabled={saving}
            onFile={imageChanged}
          />

          <label>
            <span>Brainrot Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Tung Tung Sahur"
              disabled={saving}
            />
          </label>

          <div className="admin-brainrot-deposit-form-row">
            <label>
              <span>Rarity</span>
              <select
                value={rarity}
                onChange={(event) => setRarity(event.target.value)}
                disabled={saving}
              >
                {RARITIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Deposit Value</span>
              <div className="admin-brainrot-deposit-money">
                <b>$</b>
                <input
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
            </label>
          </div>

          <label className="admin-brainrot-deposit-active">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              disabled={saving}
            />
            <span>
              <strong>Accepted for deposits</strong>
              <small>Inactive items are hidden from users but remain in Admin.</small>
            </span>
          </label>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingItem
                ? "Save Changes"
                : "Add to Accepted Deposits"}
          </button>
        </form>

        <div className="admin-management-card admin-brainrot-deposit-list">
          <div className="admin-brainrot-deposit-list-head">
            <div>
              <div className="admin-eyebrow">ACCEPTED CATALOG</div>
              <h3>{items.length} Brainrots</h3>
              <p>Search and manage the values users see in the Deposit tab.</p>
            </div>

            <div className="admin-search-wrap">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Brainrot..."
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  ×
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="admin-brainrot-deposit-empty">Loading accepted Brainrots...</div>
          ) : visibleItems.length === 0 ? (
            <div className="admin-brainrot-deposit-empty">
              <strong>No accepted Brainrots found.</strong>
              <span>Add your first accepted Brainrot using the form.</span>
            </div>
          ) : (
            <div className="admin-brainrot-deposit-table-wrap">
              <table className="admin-brainrot-deposit-table">
                <thead>
                  <tr>
                    <th>Brainrot</th>
                    <th>Rarity</th>
                    <th>Deposit Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id} className={!item.active ? "is-inactive" : ""}>
                      <td>
                        <div className="admin-brainrot-deposit-item-cell">
                          <div className="admin-brainrot-deposit-thumb">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" draggable="false" />
                            ) : (
                              <span>◇</span>
                            )}
                          </div>
                          <div>
                            <strong>{item.name}</strong>
                            <small>#{item.id}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`admin-brainrot-rarity ${String(item.rarity || "Common").toLowerCase()}`}>
                          {item.rarity}
                        </span>
                      </td>

                      <td className="admin-brainrot-value">
                        {money(item.value_cents)}
                      </td>

                      <td>
                        <span className={`admin-brainrot-status ${item.active ? "active" : "inactive"}`}>
                          {item.active ? "Accepted" : "Hidden"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-brainrot-actions">
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() => openEdit(item)}
                            disabled={saving}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-danger-button"
                            onClick={() => void remove(item)}
                            disabled={saving}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
