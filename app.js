/******************************************************************
 * PROJECT      : Database Wisata
 * MODULE       : Aplikasi INPUT
 * FILE         : app.js
 * VERSION      : 1.0.0
 * AUTHOR       : Jimmy
 * CREATED      : 28/08/2026
 * LAST UPDATE  : 28/08/2026
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Input Database Wisata:
 * - Memuat master kategori & kota dari Apps Script API.
 * - Validasi & kirim data baru (saveDatabase) ke API.
 * - Nomor WhatsApp dirapikan di preview sebelum dikirim
 *   (normalisasi final tetap dilakukan di server/Apps Script).
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - index.html (elemen form: kategori, nama, kota, namaKontak,
 *   whatsapp, createdBy, previewId, statusBar)
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 ******************************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbwgLNELtjqmupbRBaM7zXdoVMSNOtd4Y3CIIEOYWNgNmQHYFxb3aj2prmx98EbzL4zJ/exec";

const ACTION_GET_KATEGORI = "getKategori";
const ACTION_GET_KOTA = "getKota";
const ACTION_SAVE_DATABASE = "saveDatabase";

const STATUS_SHOW_DURATION = 3200;

/******************************************************************
 * CONFIGURATION
 ******************************************************************/
const formInput = document.getElementById("formInput");
const kategoriSelect = document.getElementById("kategori");
const kotaSelect = document.getElementById("kota");
const previewId = document.getElementById("previewId");
const btnSubmit = document.getElementById("btnSubmit");
const statusBar = document.getElementById("statusBar");

/******************************************************************
 * SECTION - INIT
 * ----------------------------------------------------------------
 * Dijalankan saat halaman dibuka.
 ******************************************************************/
document.addEventListener("DOMContentLoaded", function () {
  loadKategori();
  loadKota();
  formInput.addEventListener("submit", handleSubmit);
});

/******************************************************************
 * SECTION - MASTER DATA
 ******************************************************************/

/******************************************************************
 * Function : loadKategori()
 * Tujuan   : Mengambil daftar kategori aktif dan mengisi dropdown.
 ******************************************************************/
function loadKategori() {
  fetchApi(ACTION_GET_KATEGORI)
    .then(function (result) {
      fillDropdown(kategoriSelect, result.data, "kategori", "Pilih kategori");
    })
    .catch(function (error) {
      console.error("[loadKategori]", error);
      showStatus("Gagal memuat kategori.", "error");
    });
}

/******************************************************************
 * Function : loadKota()
 * Tujuan   : Mengambil daftar kota/kabupaten aktif dan mengisi
 *            dropdown.
 ******************************************************************/
function loadKota() {
  fetchApi(ACTION_GET_KOTA)
    .then(function (result) {
      fillDropdown(kotaSelect, result.data, "kotaKabupaten", "Pilih kota/kabupaten");
    })
    .catch(function (error) {
      console.error("[loadKota]", error);
      showStatus("Gagal memuat kota/kabupaten.", "error");
    });
}

/******************************************************************
 * Function : fillDropdown(selectElement, items, fieldName, placeholder)
 * Tujuan   : Mengisi elemen <select> dengan daftar opsi dari API.
 ******************************************************************/
function fillDropdown(selectElement, items, fieldName, placeholder) {
  selectElement.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  selectElement.appendChild(placeholderOption);

  items.forEach(function (item) {
    const option = document.createElement("option");
    option.value = item[fieldName];
    option.textContent = item[fieldName];
    selectElement.appendChild(option);
  });
}

/******************************************************************
 * SECTION - SUBMIT
 ******************************************************************/

/******************************************************************
 * Function : handleSubmit(event)
 * Tujuan   : Validasi ringan di sisi frontend, lalu mengirim data
 *            ke Apps Script (saveDatabase).
 ******************************************************************/
function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    action: ACTION_SAVE_DATABASE,
    kategori: kategoriSelect.value,
    nama: document.getElementById("nama").value,
    kotaKabupaten: kotaSelect.value,
    namaKontak: document.getElementById("namaKontak").value,
    whatsapp: document.getElementById("whatsapp").value,
    createdBy: document.getElementById("createdBy").value
  };

  if (payload.kategori === "" || payload.nama.trim() === "" || payload.kotaKabupaten === "") {
    showStatus("Kategori, Nama, dan Kota/Kabupaten wajib diisi.", "error");
    return;
  }

  setSubmitting(true);

  postApi(payload)
    .then(function (result) {
      if (!result.success) {
        throw new Error(result.error || "Gagal menyimpan data.");
      }
      previewId.textContent = result.data.id;
      showStatus("Data \"" + result.data.nama + "\" berhasil disimpan.", "success");
      formInput.reset();
    })
    .catch(function (error) {
      console.error("[handleSubmit]", error);
      showStatus(error.message, "error");
    })
    .finally(function () {
      setSubmitting(false);
    });
}

/******************************************************************
 * SECTION - API HELPER
 ******************************************************************/

/******************************************************************
 * Function : fetchApi(action)
 * Tujuan   : Memanggil endpoint GET Apps Script.
 ******************************************************************/
function fetchApi(action) {
  return fetch(API_URL + "?action=" + encodeURIComponent(action))
    .then(function (response) {
      return response.json();
    });
}

/******************************************************************
 * Function : postApi(payload)
 * Tujuan   : Mengirim data ke endpoint POST Apps Script.
 *            Content-Type text/plain dipakai agar tidak memicu
 *            CORS preflight pada Web App Apps Script.
 ******************************************************************/
function postApi(payload) {
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(function (response) {
    return response.json();
  });
}

/******************************************************************
 * SECTION - UI HELPER
 ******************************************************************/

/******************************************************************
 * Function : setSubmitting(isSubmitting)
 * Tujuan   : Mengunci tombol submit selagi request berjalan.
 ******************************************************************/
function setSubmitting(isSubmitting) {
  btnSubmit.disabled = isSubmitting;
  btnSubmit.textContent = isSubmitting ? "Menyimpan..." : "Simpan Data";
}

/******************************************************************
 * Function : showStatus(message, type)
 * Tujuan   : Menampilkan status bar sementara (sukses/error).
 ******************************************************************/
function showStatus(message, type) {
  statusBar.textContent = message;
  statusBar.className = "status-bar show " + type;

  setTimeout(function () {
    statusBar.className = "status-bar";
  }, STATUS_SHOW_DURATION);
}
