const config = window.JOURNEY_CONFIG || {};
const toast = document.querySelector("#toast");
const heroPhoto = document.querySelector("#heroPhoto");
const heroPhotoTrack = document.querySelector("#heroPhotoTrack");
const photoGrid = document.querySelector("#photoGrid");
const wishGrid = document.querySelector("#wishGrid");
const wishForm = document.querySelector("#wishForm");
const wishMessage = document.querySelector("#wishMessage");
const messageCount = document.querySelector("#messageCount");
const adminDialog = document.querySelector("#adminDialog");
const loginForm = document.querySelector("#loginForm");
const adminPanel = document.querySelector("#adminPanel");
const libraryInput = document.querySelector("#libraryInput");
const adminPhotoGrid = document.querySelector("#adminPhotoGrid");
const adminWishList = document.querySelector("#adminWishList");

let client = null;
let adminUser = null;
let photos = [];
let wishes = [];
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value = "") {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function photoUrl(name, version = "") {
  const { data } = client.storage.from("journey").getPublicUrl(name);
  return `${data.publicUrl}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}

function renderHeroMarquee() {
  if (!photos.length) return;
  const selection = shuffle(photos).slice(0, Math.min(8, photos.length));
  const loop = [...selection, ...selection];
  heroPhotoTrack.innerHTML = loop.map((photo, index) => `<div class="hero-slide" style="background-image:url('${photo.url.replace(/'/g, "%27")}')"><span>${String((index % selection.length) + 1).padStart(2, "0")}</span></div>`).join("");
  heroPhotoTrack.style.setProperty("--slide-count", selection.length);
  heroPhotoTrack.style.setProperty("--marquee-duration", `${Math.max(20, selection.length * 5)}s`);
  heroPhoto.classList.add("has-image");
}

function renderRandomPhotos() {
  if (!photos.length) {
    photoGrid.innerHTML = Array.from({ length: 5 }, () => '<div class="memory-card empty-photo">THÊM ẢNH TỪ TRANG QUẢN TRỊ</div>').join("");
    return;
  }
  const selection = shuffle(photos).slice(0, Math.min(5, photos.length));
  photoGrid.innerHTML = selection.map((photo, index) => `<article class="memory-card" style="background-image:url('${photo.url.replace(/'/g, "%27")}')"><span>MEMORY / ${String(index + 1).padStart(2, "0")}</span></article>`).join("");
  renderHeroMarquee();
}

function renderRandomWishes() {
  if (!wishes.length) {
    wishGrid.innerHTML = '<p class="empty-state">Chưa có lời chúc nào. Bạn sẽ là người đầu tiên chứ?</p>';
    return;
  }
  const amount = Math.min(wishes.length, 2 + Math.floor(Math.random() * 2));
  const selection = shuffle(wishes).slice(0, amount);
  wishGrid.innerHTML = selection.map((wish) => {
    const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(wish.created_at));
    return `<article class="wish-card"><p>${escapeHtml(wish.message)}</p><footer>${escapeHtml(wish.name)}<time>${date}</time></footer></article>`;
  }).join("");
}

async function loadPhotos() {
  if (!client) return;
  const { data, error } = await client.storage.from("journey").list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  photos = (data || []).filter((item) => item.name && !item.name.endsWith(".emptyFolderPlaceholder")).map((item) => ({
    name: item.name,
    url: photoUrl(item.name, item.updated_at || item.created_at || ""),
    size: item.metadata?.size || 0,
  }));
  renderRandomPhotos();
  if (adminUser) renderAdminPhotos();
}

async function loadWishes() {
  if (!client) return;
  const { data, error } = await client.from("graduation_wishes").select("id,name,message,created_at").eq("approved", true).order("created_at", { ascending: false }).limit(300);
  if (error) {
    console.warn("Wish table is not ready:", error.message);
    wishGrid.innerHTML = '<p class="empty-state">Sổ lời chúc đang được chuẩn bị.</p>';
    return;
  }
  wishes = data || [];
  renderRandomWishes();
  renderAdminWishes();
}

async function optimizeImage(file) {
  let bitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (_) { bitmap = await createImageBitmap(file); }
  const ratio = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const context = canvas.getContext("2d", { alpha: false });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#061a34";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob) throw new Error("Không thể xử lý ảnh");
  return blob;
}

function renderAdminPhotos() {
  document.querySelector("#photoCount").textContent = photos.length;
  adminPhotoGrid.innerHTML = photos.map((photo) => `<div class="admin-photo" style="background-image:url('${photo.url.replace(/'/g, "%27")}')"><button type="button" data-photo="${escapeHtml(photo.name)}" aria-label="Xóa ảnh">×</button></div>`).join("");
}

function renderAdminWishes() {
  document.querySelector("#wishCount").textContent = wishes.length;
  adminWishList.innerHTML = wishes.map((wish) => `<div class="admin-wish"><strong>${escapeHtml(wish.name)}</strong>${escapeHtml(wish.message)}<button type="button" data-wish="${wish.id}" aria-label="Xóa lời chúc">×</button></div>`).join("");
}

function updateAdminState() {
  const signedIn = Boolean(adminUser);
  loginForm.hidden = signedIn;
  adminPanel.hidden = !signedIn;
  if (signedIn) { renderAdminPhotos(); renderAdminWishes(); }
}

async function initialize() {
  if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
    renderRandomPhotos();
    wishGrid.innerHTML = '<p class="empty-state">Supabase chưa được cấu hình.</p>';
    return;
  }
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await client.auth.getSession();
  const user = data.session?.user || null;
  adminUser = user?.email === config.adminEmail ? user : null;
  updateAdminState();
  client.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user || null;
    adminUser = nextUser?.email === config.adminEmail ? nextUser : null;
    updateAdminState();
  });
  const results = await Promise.allSettled([loadPhotos(), loadWishes()]);
  results.forEach((result) => { if (result.status === "rejected") console.error(result.reason); });
}

document.querySelector("#shuffleGallery").addEventListener("click", renderRandomPhotos);
document.querySelector("#shuffleWishes").addEventListener("click", renderRandomWishes);
wishMessage.addEventListener("input", () => { messageCount.textContent = wishMessage.value.length; });

document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
  const dialog = document.querySelector(`#${button.dataset.open}`);
  if (dialog && !dialog.open) dialog.showModal();
}));
document.querySelectorAll(".content-dialog").forEach((dialog) => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close();
  });
});

wishForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return showToast("Sổ lời chúc chưa sẵn sàng.");
  if (wishForm.elements.website.value) return;
  const lastSent = Number(localStorage.getItem("graduation-wish-sent") || 0);
  if (Date.now() - lastSent < 30_000) return showToast("Chờ một chút trước khi gửi thêm lời chúc nha.");
  const name = document.querySelector("#wishName").value.trim();
  const message = wishMessage.value.trim();
  if (name.length < 2 || message.length < 3) return showToast("Bạn viết thêm một chút nữa nha.");
  const button = wishForm.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Đang gửi...";
  const { data, error } = await client.from("graduation_wishes").insert({ name, message }).select("id,name,message,created_at").single();
  button.disabled = false;
  button.innerHTML = "Gửi lời chúc <span>→</span>";
  if (error) { console.error(error); return showToast("Chưa gửi được lời chúc. Hãy thử lại nha."); }
  localStorage.setItem("graduation-wish-sent", String(Date.now()));
  wishes.unshift(data);
  wishForm.reset();
  messageCount.textContent = "0";
  renderRandomWishes();
  renderAdminWishes();
  showToast("Lời chúc của bạn đã được lưu lại 💙");
});

document.querySelector("#adminButton").addEventListener("click", () => adminDialog.showModal());
adminDialog.querySelector(".dialog-close").addEventListener("click", () => adminDialog.close());
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return showToast("Supabase chưa được cấu hình.");
  const email = document.querySelector("#adminEmail").value.trim();
  if (email !== config.adminEmail) return showToast("Tài khoản không có quyền quản trị.");
  const password = document.querySelector("#adminPassword").value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return showToast("Đăng nhập không thành công.");
  showToast("Đã mở trang quản trị.");
});
document.querySelector("#logoutButton").addEventListener("click", async () => { await client.auth.signOut(); adminDialog.close(); showToast("Đã đăng xuất."); });

document.querySelector("#optimizeLibrary").addEventListener("click", async (event) => {
  if (!client || !adminUser) return;
  const candidates = photos.filter((photo) => photo.size > 1_500_000);
  if (!candidates.length) return showToast("Không còn ảnh lớn cần tối ưu.");
  const button = event.currentTarget;
  button.disabled = true;
  try {
    for (let index = 0; index < candidates.length; index += 1) {
      const photo = candidates[index];
      showToast(`Đang tối ưu ảnh ${index + 1}/${candidates.length}...`);
      const response = await fetch(`${photo.url}${photo.url.includes("?") ? "&" : "?"}download=${Date.now()}`);
      if (!response.ok) throw new Error(`Không tải được ${photo.name}`);
      const blob = await optimizeImage(await response.blob());
      const { error } = await client.storage.from("journey").upload(photo.name, blob, { cacheControl: "31536000", contentType: "image/webp", upsert: true });
      if (error) throw error;
    }
    await loadPhotos();
    showToast(`Đã tối ưu ${candidates.length} ảnh lớn.`);
  } catch (error) { console.error(error); showToast("Có lỗi khi tối ưu thư viện."); }
  finally { button.disabled = false; }
});

libraryInput.addEventListener("change", async () => {
  const files = [...libraryInput.files];
  if (!files.length || !adminUser) return;
  showToast(`Đang xử lý ${files.length} ảnh...`);
  try {
    for (let index = 0; index < files.length; index += 1) {
      const blob = await optimizeImage(files[index]);
      const key = `gallery-${Date.now()}-${String(index + 1).padStart(2, "0")}.webp`;
      const { error } = await client.storage.from("journey").upload(key, blob, { cacheControl: "31536000", contentType: "image/webp" });
      if (error) throw error;
    }
    await loadPhotos();
    showToast(`Đã thêm ${files.length} ảnh vào thư viện.`);
  } catch (error) { console.error(error); showToast("Có ảnh chưa tải lên được. Hãy thử lại."); }
  libraryInput.value = "";
});

adminPhotoGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-photo]");
  if (!button || !adminUser || !confirm("Xóa ảnh này khỏi thư viện?")) return;
  const { error } = await client.storage.from("journey").remove([button.dataset.photo]);
  if (error) return showToast("Không thể xóa ảnh.");
  photos = photos.filter((photo) => photo.name !== button.dataset.photo);
  renderRandomPhotos(); renderAdminPhotos(); showToast("Đã xóa ảnh.");
});

adminWishList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-wish]");
  if (!button || !adminUser || !confirm("Xóa lời chúc này?")) return;
  const { error } = await client.from("graduation_wishes").delete().eq("id", button.dataset.wish);
  if (error) return showToast("Không thể xóa lời chúc.");
  wishes = wishes.filter((wish) => wish.id !== button.dataset.wish);
  renderRandomWishes(); renderAdminWishes(); showToast("Đã xóa lời chúc.");
});

initialize();

window.setInterval(() => {
  if (!document.hidden && wishes.length) renderRandomWishes();
}, 8000);

if (location.hash === "#wishes") document.querySelector("#wishDialog").showModal();
if (location.hash === "#moments") document.querySelector("#galleryDialog").showModal();
