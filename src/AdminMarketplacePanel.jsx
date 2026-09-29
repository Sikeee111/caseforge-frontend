import React, { useEffect, useMemo, useRef, useState } from "react";
import "./admin-marketplace.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const FALLBACK_GAMES = [
  { slug: "steal-a-brainrot", name: "Steal a Brainrot", theme: "purple" },
  { slug: "donutsmp", name: "DonutSMP", theme: "blue" },
];

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

async function uploadMarketplaceImage(file) {
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

function ImagePicker({ file, preview, onChange, disabled, label = "Upload item image" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (nextFile) => {
    if (!nextFile || disabled) return;
    if (!IMAGE_TYPES.includes(nextFile.type)) {
      onChange(null, "Please use a PNG, JPG or WEBP image.");
      return;
    }
    if (nextFile.size > MAX_IMAGE_BYTES) {
      onChange(null, "Image must be 5 MB or smaller.");
      return;
    }
    onChange(nextFile, "");
  };

  return (
    <button
      type="button"
      className={`marketplace-image-picker${dragging ? " is-dragging" : ""}${preview ? " has-image" : ""}`}
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
        acceptFile(event.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        disabled={disabled}
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {preview ? (
        <>
          <img src={preview} alt="Preview" className="marketplace-image-preview" />
          <span className="marketplace-image-copy">
            <strong>{file?.name || "Image selected"}</strong>
            <small>Click or drag to replace the image.</small>
          </span>
        </>
      ) : (
        <>
          <span className="marketplace-upload-icon">↑</span>
          <span className="marketplace-image-copy">
            <strong>{label}</strong>
            <small>PNG, JPG or WEBP · Max 5 MB</small>
          </span>
        </>
      )}
    </button>
  );
}

export default function AdminMarketplacePanel() {
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [listings, setListings] = useState([]);
  const [gameSlug, setGameSlug] = useState("steal-a-brainrot");

  const [title, setTitle] = useState("");
  const [rarity, setRarity] = useState("Common");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [editListing, setEditListing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRarity, setEditRarity] = useState("Common");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedGame = useMemo(
    () => games.find((game) => game.slug === gameSlug) || FALLBACK_GAMES[0],
    [games, gameSlug]
  );

  const filteredListings = useMemo(
    () => listings.filter((listing) => {
      if (String(listing.game_slug || "") !== gameSlug) return false;

      // A deleted listing is stored safely as inactive + zero stock.
      // Keep paused listings with stock visible, but keep deleted listings out
      // of the Admin list even after Refresh/page reload.
      if (!listing.active && Number(listing.stock || 0) === 0) return false;

      return true;
    }),
    [listings, gameSlug]
  );

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [gamesResponse, listingsResponse] = await Promise.all([
        apiFetch(`${API}/api/games`, { cache: "no-store" }),
        apiFetch(`${API}/api/admin/marketplace`, { cache: "no-store" }),
      ]);

      const [gamesData, listingsData] = await Promise.all([
        readJson(gamesResponse),
        readJson(listingsResponse),
      ]);

      if (!gamesResponse.ok) throw new Error(gamesData.error || "Failed to load games.");
      if (!listingsResponse.ok) throw new Error(listingsData.error || "Failed to load marketplace.");

      setGames(
        Array.isArray(gamesData.games) && gamesData.games.length
          ? gamesData.games
          : FALLBACK_GAMES
      );
      setListings(Array.isArray(listingsData.listings) ? listingsData.listings : []);
    } catch (err) {
      console.error("Marketplace admin load failed:", err);
      setError(err.message || "Failed to load marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetCreateForm = () => {
    setTitle("");
    setRarity("Common");
    setPrice("");
    setStock("1");
    setImageFile(null);
    setImagePreview("");
  };

  const createImageChanged = (file, nextError) => {
    setError(nextError || "");
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    setImageFile(file);
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const editImageChanged = (file, nextError) => {
    setError(nextError || "");
    if (!file) {
      setEditImageFile(null);
      return;
    }

    setEditImageFile(file);
    setEditImagePreview((current) => {
      if (current && current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      if (editImagePreview?.startsWith("blob:")) URL.revokeObjectURL(editImagePreview);
    };
  }, [imagePreview, editImagePreview]);

  const createListing = async (event) => {
    event.preventDefault();

    const cleanTitle = title.trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!cleanTitle) return setError("Enter an item title.");
    if (!imageFile) return setError("Attach an item image.");
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError("Enter a valid price.");
    if (!Number.isSafeInteger(numericStock) || numericStock < 0) return setError("Enter a valid stock amount.");

    const priceCents = Math.round(numericPrice * 100);

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const imageUrl = await uploadMarketplaceImage(imageFile);

      const itemResponse = await apiFetch(`${API}/api/admin/items`, {
        method: "POST",
        body: JSON.stringify({
          name: cleanTitle,
          rarity,
          valueCents: priceCents,
          imageUrl,
          gameSlug,
        }),
      });

      const itemData = await readJson(itemResponse);
      if (!itemResponse.ok || !itemData.id) {
        throw new Error(itemData.error || "Failed to create marketplace item.");
      }

      const listingResponse = await apiFetch(`${API}/api/admin/marketplace`, {
        method: "POST",
        body: JSON.stringify({
          gameSlug,
          itemId: Number(itemData.id),
          priceCents,
          stock: numericStock,
        }),
      });

      const listingData = await readJson(listingResponse);
      if (!listingResponse.ok) {
        throw new Error(listingData.error || "Failed to create marketplace listing.");
      }

      resetCreateForm();
      await load();
      setSuccess(`${cleanTitle} was added to the ${selectedGame.name} marketplace.`);
    } catch (err) {
      console.error("Marketplace item creation failed:", err);
      setError(err.message || "Failed to create marketplace item.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (listing) => {
    setError("");
    setSuccess("");
    setEditListing(listing);
    setEditTitle(String(listing.name || ""));
    setEditRarity(String(listing.rarity || "Common"));
    setEditPrice((Number(listing.price_cents || 0) / 100).toFixed(2));
    setEditStock(String(listing.stock ?? 0));
    setEditImageFile(null);
    setEditImagePreview(String(listing.image_url || ""));
  };

  const closeEdit = () => {
    if (saving) return;
    setEditListing(null);
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const saveListing = async () => {
    if (!editListing) return;

    const cleanTitle = editTitle.trim();
    const numericPrice = Number(editPrice);
    const numericStock = Number(editStock);
    const itemId = Number(editListing.item_id ?? editListing.itemId ?? 0);

    if (!cleanTitle) return setError("Enter an item title.");
    if (!RARITIES.includes(editRarity)) return setError("Choose a valid rarity.");
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return setError("Enter a valid price.");
    if (!Number.isSafeInteger(numericStock) || numericStock < 0) return setError("Enter a valid stock amount.");
    if (!Number.isInteger(itemId) || itemId <= 0) return setError("This listing is missing its item ID.");

    const nextPriceCents = Math.round(numericPrice * 100);

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = String(editListing.image_url || "");

      if (editImageFile) {
        imageUrl = await uploadMarketplaceImage(editImageFile);
      }

      const itemResponse = await apiFetch(`${API}/api/admin/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: cleanTitle,
          rarity: editRarity,
          valueCents: nextPriceCents,
          imageUrl: imageUrl || null,
        }),
      });

      const itemData = await readJson(itemResponse);
      if (!itemResponse.ok) {
        throw new Error(itemData.error || "Failed to update marketplace item.");
      }

      const listingResponse = await apiFetch(
        `${API}/api/admin/marketplace/${editListing.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            priceCents: nextPriceCents,
            stock: numericStock,
            active: Boolean(editListing.active),
          }),
        }
      );

      const listingData = await readJson(listingResponse);
      if (!listingResponse.ok) {
        throw new Error(listingData.error || "Failed to update marketplace listing.");
      }

      closeEdit();
      await load();
      setSuccess(`${cleanTitle} was updated successfully.`);
    } catch (err) {
      console.error("Marketplace edit failed:", err);
      setError(err.message || "Failed to update marketplace item.");
    } finally {
      setSaving(false);
    }
  };

  const toggleListing = async (listing) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(`${API}/api/admin/marketplace/${listing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          priceCents: Number(listing.price_cents),
          stock: Number(listing.stock),
          active: !listing.active,
        }),
      });

      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to update listing.");

      await load();
      setSuccess(listing.active ? `${listing.name} is now paused.` : `${listing.name} is live again.`);
    } catch (err) {
      console.error("Marketplace pause toggle failed:", err);
      setError(err.message || "Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async (listing) => {
    const confirmed = window.confirm(
      `Remove ${listing.name} from the marketplace?\n\nIt will no longer be purchasable, but its underlying item and transaction history will remain safe.`
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Marketplace removal is intentionally soft-delete: disable the listing and
      // set stock to zero so old purchases/inventory history remain intact.
      const response = await apiFetch(`${API}/api/admin/marketplace/${listing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          priceCents: Number(listing.price_cents),
          stock: 0,
          active: false,
        }),
      });

      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Failed to remove listing.");

      setListings((current) =>
        current.filter((entry) => Number(entry.id) !== Number(listing.id))
      );
      setSuccess(`${listing.name} was removed from the marketplace.`);
    } catch (err) {
      console.error("Marketplace listing removal failed:", err);
      setError(err.message || "Failed to remove listing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-management-card admin-marketplace-panel">
      <div className="admin-marketplace-header">
        <div>
          <div className="admin-eyebrow">MULTI-GAME ECONOMY</div>
          <h2>Marketplace</h2>
          <p>Create products independently from Rewards. Upload an image, choose a title, rarity, price and stock.</p>
        </div>

        <div className="admin-marketplace-game-switcher" role="tablist" aria-label="Marketplace game">
          {games.map((game) => (
            <button
              key={game.slug}
              type="button"
              className={gameSlug === game.slug ? "active" : ""}
              onClick={() => {
                setGameSlug(game.slug);
                setError("");
                setSuccess("");
                closeEdit();
              }}
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>

      <form className="admin-marketplace-create-card" onSubmit={createListing}>
        <div className="admin-marketplace-section-title">
          <div>
            <span className="admin-marketplace-kicker">NEW LISTING</span>
            <h3>Add {selectedGame.name} item</h3>
          </div>
          <span className="admin-marketplace-game-pill">{selectedGame.name}</span>
        </div>

        <div className="admin-marketplace-create-layout">
          <ImagePicker
            file={imageFile}
            preview={imagePreview}
            onChange={createImageChanged}
            disabled={saving}
          />

          <div className="admin-marketplace-form-fields">
            <label>
              <span>Item name</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Rainbow Garama" maxLength={120} />
            </label>

            <label>
              <span>Rarity</span>
              <select value={rarity} onChange={(event) => setRarity(event.target.value)}>
                {RARITIES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>

            <div className="admin-marketplace-form-row">
              <label>
                <span>Selling price</span>
                <div className="admin-marketplace-money-input">
                  <b>$</b>
                  <input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="15.00" />
                </div>
              </label>

              <label>
                <span>Stock</span>
                <input type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="100" />
              </label>
            </div>

            <button type="submit" className="admin-primary-button admin-marketplace-create-button" disabled={saving}>
              {saving ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </div>
      </form>

      {(error || success) && (
        <div className={`admin-marketplace-alert ${error ? "error" : "success"}`}>
          <strong>{error ? "Error" : "Saved"}</strong>
          <span>{error || success}</span>
          <button type="button" onClick={() => { setError(""); setSuccess(""); }}>×</button>
        </div>
      )}

      <div className="admin-marketplace-list-head">
        <div>
          <span className="admin-marketplace-kicker">LIVE LISTINGS</span>
          <h3>{selectedGame.name} products</h3>
          <p>{filteredListings.length} marketplace listing{filteredListings.length === 1 ? "" : "s"}</p>
        </div>
        <button type="button" className="admin-secondary-button" onClick={() => void load()} disabled={loading || saving}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="admin-marketplace-empty">Loading marketplace...</div>
      ) : filteredListings.length === 0 ? (
        <div className="admin-marketplace-empty">
          <strong>No listings yet.</strong>
          <span>Create a product above and it will appear here.</span>
        </div>
      ) : (
        <div className="admin-marketplace-list-grid">
          {filteredListings.map((listing) => (
            <article className={`admin-marketplace-card${listing.active ? "" : " is-paused"}`} key={listing.id}>
              <div className="admin-marketplace-card-image">
                {listing.image_url ? <img src={listing.image_url} alt="" draggable="false" /> : <span>◇</span>}
                <span className={`admin-marketplace-status ${listing.active ? "live" : "paused"}`}>
                  {listing.active ? "LIVE" : "PAUSED"}
                </span>
              </div>

              <div className="admin-marketplace-card-body">
                <div className="admin-marketplace-card-copy">
                  <h4>{listing.name}</h4>
                  <span>{listing.rarity}</span>
                </div>

                <div className="admin-marketplace-card-stats">
                  <div><small>PRICE</small><strong>{money(listing.price_cents)}</strong></div>
                  <div><small>STOCK</small><strong>{Number(listing.stock || 0)}</strong></div>
                </div>

                <div className="admin-marketplace-card-actions">
                  <button type="button" className="admin-secondary-button" onClick={() => openEdit(listing)} disabled={saving}>
                    Edit
                  </button>
                  <button type="button" className="admin-secondary-button" onClick={() => void toggleListing(listing)} disabled={saving}>
                    {listing.active ? "Pause" : "Resume"}
                  </button>
                  <button type="button" className="admin-marketplace-delete-button" onClick={() => void deleteListing(listing)} disabled={saving}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editListing && (
        <div className="admin-marketplace-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEdit(); }}>
          <div className="admin-marketplace-modal" role="dialog" aria-modal="true" aria-labelledby="marketplace-edit-title">
            <div className="admin-marketplace-modal-head">
              <div>
                <span className="admin-marketplace-kicker">EDIT LISTING</span>
                <h3 id="marketplace-edit-title">{editListing.name}</h3>
                <p>Update the product without creating a new listing.</p>
              </div>
              <button type="button" className="admin-marketplace-close" onClick={closeEdit} disabled={saving}>×</button>
            </div>

            <div className="admin-marketplace-edit-layout">
              <ImagePicker
                file={editImageFile}
                preview={editImagePreview}
                onChange={editImageChanged}
                disabled={saving}
                label="Change item image"
              />

              <div className="admin-marketplace-form-fields">
                <label>
                  <span>Item name</span>
                  <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={120} />
                </label>

                <label>
                  <span>Rarity</span>
                  <select value={editRarity} onChange={(event) => setEditRarity(event.target.value)}>
                    {RARITIES.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>

                <div className="admin-marketplace-form-row">
                  <label>
                    <span>Price</span>
                    <div className="admin-marketplace-money-input">
                      <b>$</b>
                      <input type="number" min="0.01" step="0.01" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} />
                    </div>
                  </label>

                  <label>
                    <span>Stock</span>
                    <input type="number" min="0" step="1" value={editStock} onChange={(event) => setEditStock(event.target.value)} />
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-marketplace-modal-actions">
              <button type="button" className="admin-secondary-button" onClick={closeEdit} disabled={saving}>Cancel</button>
              <button type="button" className="admin-primary-button" onClick={() => void saveListing()} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
