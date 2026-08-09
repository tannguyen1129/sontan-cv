const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const photos = [...document.querySelectorAll(".photo")];
const toast = document.querySelector("#uploadToast");
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/jpeg,image/png,image/webp,image/avif";
fileInput.hidden = true;
document.body.appendChild(fileInput);

let activePhoto = null;
let toastTimer;
let database;
let cloudClient = null;
let adminUser = null;

const config = window.JOURNEY_CONFIG || {};
const adminButton = document.querySelector("#adminButton");
const adminDialog = document.querySelector("#adminDialog");
const loginForm = document.querySelector("#loginForm");
const signedInPanel = document.querySelector("#signedInPanel");
const adminEmailInput = document.querySelector("#adminEmail");
const logoutButton = document.querySelector("#logoutButton");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function getPhotoKey(photo) {
  const chapter = photo.closest(".year-chapter");
  const chapterPhotos = [...chapter.querySelectorAll(".photo")];
  return `${chapter.id}-${chapterPhotos.indexOf(photo) + 1}`;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("son-tan-journey", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("photos");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function savePhoto(key, file) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("photos", "readwrite");
    transaction.objectStore("photos").put(file, key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function readPhoto(key) {
  return new Promise((resolve, reject) => {
    const request = database.transaction("photos").objectStore("photos").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function displayPhoto(photo, source) {
  const oldUrl = photo.dataset.objectUrl;
  if (oldUrl) URL.revokeObjectURL(oldUrl);
  const imageUrl = typeof source === "string" ? source : URL.createObjectURL(source);
  if (typeof source !== "string") photo.dataset.objectUrl = imageUrl;
  photo.style.backgroundImage = `url("${imageUrl}")`;
  photo.classList.add("has-image");
}

function updateAdminInterface() {
  const signedIn = Boolean(adminUser);
  loginForm.hidden = signedIn;
  signedInPanel.hidden = !signedIn;
  adminButton.textContent = signedIn ? "Đang quản lý ảnh" : "Quản lý ảnh";
  document.body.classList.toggle("admin-mode", signedIn);
}

async function initializeCloud() {
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) return false;
  cloudClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await cloudClient.auth.getSession();
  const sessionUser = data.session?.user || null;
  adminUser = sessionUser?.email === config.adminEmail ? sessionUser : null;
  updateAdminInterface();

  cloudClient.auth.onAuthStateChange((_event, session) => {
    const user = session?.user || null;
    adminUser = user?.email === config.adminEmail ? user : null;
    updateAdminInterface();
  });
  return true;
}

async function restoreCloudPhotos() {
  const { data, error } = await cloudClient.storage.from("journey").list("", { limit: 100 });
  if (error) throw error;
  const available = new Set(data.map((item) => item.name));
  photos.forEach((photo) => {
    const key = getPhotoKey(photo);
    if (!available.has(key)) return;
    const { data: publicData } = cloudClient.storage.from("journey").getPublicUrl(key);
    displayPhoto(photo, `${publicData.publicUrl}?v=${Date.now()}`);
  });
}

photos.forEach((photo) => {
  photo.setAttribute("role", "button");
  photo.setAttribute("tabindex", "0");
  photo.setAttribute("aria-label", "Chọn ảnh kỷ niệm");
  photo.addEventListener("click", () => {
    if (cloudClient && !adminUser) {
      adminDialog.showModal();
      return;
    }
    activePhoto = photo;
    fileInput.value = "";
    fileInput.click();
  });
  photo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      photo.click();
    }
  });
});

fileInput.addEventListener("change", async () => {
  const [file] = fileInput.files;
  if (!file || !activePhoto) return;
  if (!file.type.startsWith("image/")) {
    showToast("Vui lòng chọn một tệp hình ảnh.");
    return;
  }
  try {
    const key = getPhotoKey(activePhoto);
    if (cloudClient) {
      const { error } = await cloudClient.storage.from("journey").upload(key, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;
      const { data } = cloudClient.storage.from("journey").getPublicUrl(key);
      displayPhoto(activePhoto, `${data.publicUrl}?v=${Date.now()}`);
      showToast("Đã lưu ảnh trực tuyến!");
    } else {
      await savePhoto(key, file);
      displayPhoto(activePhoto, file);
      showToast("Đã lưu ảnh trên thiết bị này!");
    }
  } catch (error) {
    console.error(error);
    showToast("Không thể lưu ảnh. Vui lòng thử lại.");
  }
});

async function restoreLocalPhotos() {
  try {
    database = await openDatabase();
    await Promise.all(photos.map(async (photo) => {
      const file = await readPhoto(getPhotoKey(photo));
      if (file) displayPhoto(photo, file);
    }));
  } catch (error) {
    console.error(error);
    showToast("Trình duyệt không hỗ trợ lưu ảnh cục bộ.");
  }
}

adminButton.addEventListener("click", () => adminDialog.showModal());
adminDialog.querySelector(".dialog-close").addEventListener("click", () => adminDialog.close());

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!cloudClient) {
    showToast("Supabase chưa được cấu hình.");
    return;
  }
  const email = adminEmailInput.value.trim();
  if (email !== config.adminEmail) {
    showToast("Tài khoản này không có quyền quản trị.");
    return;
  }
  const password = document.querySelector("#adminPassword").value;
  const { error } = await cloudClient.auth.signInWithPassword({ email, password });
  if (error) {
    showToast("Đăng nhập thất bại. Hãy kiểm tra email và mật khẩu.");
    return;
  }
  adminDialog.close();
  showToast("Đã bật chế độ quản lý ảnh.");
});

logoutButton.addEventListener("click", async () => {
  if (cloudClient) await cloudClient.auth.signOut();
  adminDialog.close();
  showToast("Đã đăng xuất.");
});

async function startGallery() {
  try {
    const cloudReady = await initializeCloud();
    if (cloudReady) {
      await restoreCloudPhotos();
      return;
    }
  } catch (error) {
    console.error(error);
    showToast("Không kết nối được kho ảnh; đang dùng dữ liệu trên máy.");
  }
  await restoreLocalPhotos();
}

startGallery();
