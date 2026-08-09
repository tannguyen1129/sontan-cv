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

const infrastructureArtwork = `
  <svg class="chapter-infra" viewBox="0 0 1200 900" aria-hidden="true">
    <g class="infra-circuits">
      <path d="M0 126h95l34 34h100l28-28h88" />
      <path d="M1200 265h-84l-31 31h-89l-25-25h-63" />
      <path d="M0 724h66l30-30h108l25 25h84" />
      <path d="M1200 784h-118l-25-25h-81" />
      <circle cx="345" cy="132" r="5"/><circle cx="908" cy="271" r="5"/>
      <circle cx="313" cy="719" r="5"/><circle cx="976" cy="759" r="5"/>
    </g>
    <g class="infra-server">
      <rect x="40" y="300" width="132" height="220" rx="10"/>
      <rect x="56" y="321" width="100" height="43" rx="4"/>
      <rect x="56" y="377" width="100" height="43" rx="4"/>
      <rect x="56" y="433" width="100" height="43" rx="4"/>
      <path d="M69 342h2m13 0h54M69 398h2m13 0h54M69 454h2m13 0h54M70 499h72"/>
      <circle cx="145" cy="342" r="4"/><circle cx="145" cy="398" r="4"/><circle cx="145" cy="454" r="4"/>
    </g>
    <g class="infra-cloud">
      <path d="M1019 137h91a31 31 0 0 0 2-62 48 48 0 0 0-91-9 37 37 0 0 0-2 71Z"/>
      <path d="M1041 105h48m-24-22v44"/>
    </g>
    <g class="infra-network">
      <circle cx="1032" cy="559" r="17"/><circle cx="1130" cy="520" r="17"/>
      <circle cx="1130" cy="640" r="17"/><circle cx="1040" cy="685" r="17"/>
      <circle cx="965" cy="620" r="17"/>
      <path d="m1048 552 66-26m16 11v86m-16 24-59 30m-30-1-46-45m3-17 35-43"/>
    </g>
    <g class="infra-data">
      <ellipse cx="291" cy="557" rx="44" ry="16"/>
      <path d="M247 557v70c0 9 20 16 44 16s44-7 44-16v-70m-88 35c0 9 20 16 44 16s44-7 44-16"/>
    </g>
  </svg>`;

document.querySelectorAll(".year-chapter").forEach((chapter) => {
  chapter.insertAdjacentHTML("afterbegin", infrastructureArtwork);
});

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
