const photoInput = document.querySelector("#photoInput");
const portraitImage = document.querySelector("#portraitImage");
const downloadButton = document.querySelector("#downloadButton");
const posterButton = document.querySelector("#posterButton");
const invitation = document.querySelector("#invitation");
const toast = document.querySelector("#toast");
const guestName = document.querySelector("#guestName");

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

photoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Vui lòng chọn một tệp hình ảnh.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    portraitImage.src = reader.result;
    showToast("Đã cập nhật ảnh của bạn!");
  });
  reader.readAsDataURL(file);
});

guestName.addEventListener("input", () => {
  guestName.title = guestName.value.trim()
    ? `Thiệp dành tặng ${guestName.value.trim()}`
    : "";
});

async function exportArtwork({ poster = false } = {}) {
  if (typeof html2canvas === "undefined") {
    showToast("Không thể tải công cụ xuất ảnh. Hãy kiểm tra kết nối mạng.");
    return;
  }

  downloadButton.disabled = true;
  posterButton.disabled = true;
  const activeButton = poster ? posterButton : downloadButton;
  const originalLabel = activeButton.querySelector("span").textContent;
  activeButton.querySelector("span").textContent = "Đang tạo ảnh...";
  invitation.classList.add("exporting");
  invitation.classList.toggle("poster-export", poster);

  try {
    await document.fonts.ready;
    if (portraitImage.decode) {
      try {
        await portraitImage.decode();
      } catch (_) {
        // The image may already be decoded by the browser.
      }
    }
    const exportPortrait = portraitImage.currentSrc || portraitImage.src;
    const canvas = await html2canvas(invitation, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      onclone: async (clonedDocument) => {
        const clonedPortrait = clonedDocument.querySelector("#portraitImage");
        if (clonedPortrait) {
          clonedPortrait.src = exportPortrait;
          clonedPortrait.removeAttribute("srcset");
          if (clonedPortrait.decode) {
            try {
              await clonedPortrait.decode();
            } catch (_) {
              // html2canvas will still attempt to paint the loaded image.
            }
          }
        }

        const clonedInput = clonedDocument.querySelector("#guestName");
        if (!poster && clonedInput && guestName.value.trim()) {
          const nameText = clonedDocument.createElement("span");
          nameText.className = "guest-name-export";
          nameText.textContent = guestName.value.trim();
          clonedInput.replaceWith(nameText);
        }
      },
    });
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const link = document.createElement("a");
    link.download = poster
      ? "poster-le-tot-nghiep-22-08-2026.png"
      : "thiep-moi-tot-nghiep-22-08-2026.png";
    link.href = canvas.toDataURL("image/png", 1);
    link.click();
    showToast(poster ? "Poster đã được tải xuống!" : "Thiệp đã được tải xuống!");
  } catch (error) {
    console.error(error);
    showToast("Có lỗi khi tạo ảnh. Vui lòng thử lại.");
  } finally {
    invitation.classList.remove("exporting");
    invitation.classList.remove("poster-export");
    downloadButton.disabled = false;
    posterButton.disabled = false;
    activeButton.querySelector("span").textContent = originalLabel;
  }
}

downloadButton.addEventListener("click", () => exportArtwork());
posterButton.addEventListener("click", () => exportArtwork({ poster: true }));
