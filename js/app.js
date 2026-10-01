const dbClient = window.supabaseClient;


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let products = [];
let suppliers = [];
let chartTrenStok;
let chartKategori;


// =====================================================
// DOM READY
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    initHeroProductAnimation();
    initThemeToggle();

    if (!dbClient) {

        showToast(
            "Koneksi Supabase tidak termuat. Periksa koneksi internet."
        );

        return;

    }

    initNavigation();

    initDate();

    initProductEvents();

    initSupplierEvents();

    initTransactionEvents();

    initSearch();

    loadDashboard();

    loadProducts();

    loadSuppliers();
    loadTransactions();

    loadReport();

});


function initThemeToggle() {

    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("glowstock_theme") || "light";
    } catch (error) {
        console.warn("Preferensi tema tidak dapat dibaca:", error);
    }

    document.body.classList.toggle("dark-mode", savedTheme === "dark");
    updateThemeToggleIcon();

    document.getElementById("theme-toggle")?.addEventListener(
        "click",
        toggleDarkMode
    );

}


function toggleDarkMode() {

    const isDark = document.body.classList.toggle("dark-mode");

    try {
        localStorage.setItem("glowstock_theme", isDark ? "dark" : "light");
    } catch (error) {
        console.warn("Preferensi tema tidak dapat disimpan:", error);
    }

    updateThemeToggleIcon();
    updateChartTheme();

}


function updateThemeToggleIcon() {

    const button = document.getElementById("theme-toggle");
    if (!button) return;

    const isDark = document.body.classList.contains("dark-mode");
    button.textContent = isDark ? "☀️" : "🌙";
    button.setAttribute("aria-label", "Ganti Tema");
    button.title = "Ganti Tema";

}


function updateChartTheme() {

    const isDark = document.body.classList.contains("dark-mode");
    const textColor = isDark ? "#e8f0e9" : "#77747a";
    const gridColor = isDark ? "#3a3f3a" : "rgba(48, 63, 54, 0.12)";

    [chartTrenStok, chartKategori].forEach(chart => {
        if (!chart) return;

        chart.options.color = textColor;
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }

        Object.values(chart.options.scales || {}).forEach(scale => {
            scale.ticks.color = textColor;
            scale.grid.color = gridColor;
            scale.border.color = gridColor;
        });

        chart.update("none");
    });

}


function initHeroProductAnimation() {

    const decoration = document.querySelector(".hero-decoration");
    const icon = document.getElementById("hero-product-icon");
    const productIcons = ["💄", "🧴", "✨", "💅"];

    if (!decoration || !icon || productIcons.length === 0) return;

    let currentIndex = 0;

    window.setInterval(() => {
        icon.classList.remove("is-changing");
        currentIndex = (currentIndex + 1) % productIcons.length;

        window.requestAnimationFrame(() => {
            icon.textContent = productIcons[currentIndex];
            icon.classList.add("is-changing");
        });
    }, 2200);

}


// =====================================================
// NAVIGATION
// =====================================================

function initNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page;


            navItems.forEach(nav => {

                nav.classList.remove("active");

            });


            item.classList.add("active");


            document
                .querySelectorAll(".page")
                .forEach(section => {

                    section.classList.remove(
                        "active-page"
                    );

                });


            const target =
                document.getElementById(
                    `${page}-page`
                );


            if (target) {

                target.classList.add(
                    "active-page"
                );

            }


            const titles = {

                dashboard: "Dashboard",

                produk: "Data Produk",

                supplier: "Data Supplier",

                transaksi: "Transaksi Persediaan",

                laporan: "Laporan Persediaan"

            };


            document.getElementById(
                "page-title"
            ).textContent =
                titles[page];


            if (page === "dashboard") {

                loadDashboard();

            }

            if (page === "produk") {

                loadProducts();

            }

            if (page === "supplier") {

                loadSuppliers();

            }

            if (page === "transaksi") {

                loadTransactions();

            }

            if (page === "laporan") {

                loadReport();

            }

        });

    });

}


// =====================================================
// DATE
// =====================================================

function initDate() {

    const date =
        new Date();

    document.getElementById(
        "current-date"
    ).textContent =
        date.toLocaleDateString(
            "id-ID",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


// =====================================================
// FORMAT RUPIAH
// =====================================================

function rupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(value || 0);

}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    document.getElementById(
        "toast-message"
    ).textContent = message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


// =====================================================
// MODAL
// =====================================================

function openModal(id) {

    document
        .getElementById(id)
        .classList.add("show");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList.remove("show");

}


document
    .querySelectorAll(".close-modal")
    .forEach(button => {

        button.addEventListener("click", () => {

            closeModal(
                button.dataset.modal
            );

        });

    });


// =====================================================
// PRODUCT
// =====================================================

function initProductEvents() {

    document
        .getElementById("btn-tambah-produk")
        .addEventListener("click", () => {

            resetProductForm();

            openModal("produk-modal");

        });


    document
        .getElementById("produk-form")
        .addEventListener(
            "submit",
            saveProduct
        );

}


async function loadProducts() {

    const {
        data,
        error
    } = await dbClient

        .from("produk")

        .select("*")

        .order(
            "produk_id",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        showToast(
            "Gagal mengambil data produk"
        );

        return;

    }


    products = data || [];

    renderProducts();

}


function renderProducts() {

    const tbody =
        document.getElementById(
            "produk-table"
        );


    const search =
        (
            document.getElementById(
                "search-produk"
            ).value || ""
        ).toLowerCase();


    const kategori =
        document.getElementById(
            "filter-kategori"
        ).value;


    const filtered =
        products.filter(product => {

            const matchSearch =
                product.nama_produk
                    .toLowerCase()
                    .includes(search)
                ||
                product.kode_produk
                    .toLowerCase()
                    .includes(search);


            const matchKategori =
                kategori === ""
                ||
                product.kategori === kategori;


            return (
                matchSearch &&
                matchKategori
            );

        });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        Data produk tidak ditemukan.
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        filtered.map(
            (product, index) => {

                const low =
                    product.stok
                    <= product.stok_minimum;


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    product.kode_produk
                                )}
                            </strong>
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    product.nama_produk
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                product.kategori
                            )}
                        </td>

                        <td>
                            ${rupiah(
                                product.harga_beli
                            )}
                        </td>

                        <td>
                            ${rupiah(
                                product.harga_jual
                            )}
                        </td>

                        <td>
                            ${product.stok}
                            ${product.satuan}
                        </td>

                        <td>

                            ${
                                low
                                ?
                                `<span class="stock-low">
                                    Stok Menipis
                                </span>`
                                :
                                `<span class="stock-good">
                                    Aman
                                </span>`
                            }

                        </td>

                        <td>

                            <div class="action-group">

                                <button
                                    class="action-btn edit-btn"
                                    onclick="editProduct(${product.produk_id})"
                                >
                                    Edit
                                </button>

                                <button
                                    class="action-btn delete-btn"
                                    onclick="deleteProduct(${product.produk_id})"
                                >
                                    Hapus
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


async function saveProduct(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "produk-id"
        ).value;


    const data = {

        kode_produk:
            document.getElementById(
                "kode-produk"
            ).value.trim(),

        nama_produk:
            document.getElementById(
                "nama-produk"
            ).value.trim(),

        kategori:
            document.getElementById(
                "kategori-produk"
            ).value,

        harga_beli:
            Number(
                document.getElementById(
                    "harga-beli"
                ).value
            ),

        harga_jual:
            Number(
                document.getElementById(
                    "harga-jual"
                ).value
            ),

        stok:
            Number(
                document.getElementById(
                    "stok-produk"
                ).value
            ),

        stok_minimum:
            Number(
                document.getElementById(
                    "stok-minimum"
                ).value
            ),

        satuan:
            document.getElementById(
                "satuan-produk"
            ).value

    };


    let result;


    if (id) {

        result =
            await dbClient

                .from("produk")

                .update(data)

                .eq(
                    "produk_id",
                    id
                );

    } else {

        result =
            await dbClient

                .from("produk")

                .insert(data);

    }


    if (result.error) {

        console.error(result.error);

        showToast(
            result.error.message
        );

        return;

    }


    closeModal("produk-modal");

    resetProductForm();

    await loadProducts();

    await loadDashboard();

    await loadReport();


    showToast(
        id
        ?
        "Produk berhasil diperbarui"
        :
        "Produk berhasil ditambahkan"
    );

}


function resetProductForm() {

    document
        .getElementById(
            "produk-form"
        )
        .reset();


    document.getElementById(
        "produk-id"
    ).value = "";


    document.getElementById(
        "produk-modal-title"
    ).textContent =
        "Tambah Produk";

}


window.editProduct =
    async function(id) {

        const product =
            products.find(
                p =>
                    p.produk_id == id
            );


        if (!product) return;


        document.getElementById(
            "produk-id"
        ).value =
            product.produk_id;


        document.getElementById(
            "kode-produk"
        ).value =
            product.kode_produk;


        document.getElementById(
            "nama-produk"
        ).value =
            product.nama_produk;


        document.getElementById(
            "kategori-produk"
        ).value =
            product.kategori;


        document.getElementById(
            "harga-beli"
        ).value =
            product.harga_beli;


        document.getElementById(
            "harga-jual"
        ).value =
            product.harga_jual;


        document.getElementById(
            "stok-produk"
        ).value =
            product.stok;


        document.getElementById(
            "stok-minimum"
        ).value =
            product.stok_minimum;


        document.getElementById(
            "satuan-produk"
        ).value =
            product.satuan;


        document.getElementById(
            "produk-modal-title"
        ).textContent =
            "Edit Produk";


        openModal("produk-modal");

    };


window.deleteProduct =
    async function(id) {

        const yakin =
            confirm(
                "Apakah produk ini ingin dihapus?"
            );


        if (!yakin) return;


        const {
            error
        } = await dbClient

            .from("produk")

            .delete()

            .eq(
                "produk_id",
                id
            );


        if (error) {

            showToast(
                "Produk tidak dapat dihapus. Mungkin sudah digunakan dalam transaksi."
            );

            console.error(error);

            return;

        }


        await loadProducts();

        await loadDashboard();

        await loadReport();


        showToast(
            "Produk berhasil dihapus"
        );

    };


// =====================================================
// SEARCH PRODUK
// =====================================================

function initSearch() {

    document
        .getElementById(
            "search-produk"
        )
        .addEventListener(
            "input",
            renderProducts
        );


    document
        .getElementById(
            "filter-kategori"
        )
        .addEventListener(
            "change",
            renderProducts
        );

}


// =====================================================
// SUPPLIER
// =====================================================

function initSupplierEvents() {

    document
        .getElementById(
            "btn-tambah-supplier"
        )
        .addEventListener(
            "click",
            () => {

                resetSupplierForm();

                openModal(
                    "supplier-modal"
                );

            }
        );


    document
        .getElementById(
            "supplier-form"
        )
        .addEventListener(
            "submit",
            saveSupplier
        );

}


async function loadSuppliers() {

    const {
        data,
        error
    } = await dbClient

        .from("supplier")

        .select("*")

        .order(
            "supplier_id",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        showToast(
            "Gagal mengambil supplier"
        );

        return;

    }


    suppliers = data || [];

    renderSuppliers();

    renderSupplierOptions();

}


function renderSuppliers() {

    const tbody =
        document.getElementById(
            "supplier-table"
        );


    if (suppliers.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        Belum ada supplier.
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        suppliers.map(
            (supplier, index) => {

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    supplier.nama_supplier
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                supplier.no_telepon
                                || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                supplier.alamat
                                || "-"
                            )}
                        </td>

                        <td>

                            <div class="action-group">

                                <button
                                    class="action-btn edit-btn"
                                    onclick="editSupplier(${supplier.supplier_id})"
                                >
                                    Edit
                                </button>

                                <button
                                    class="action-btn delete-btn"
                                    onclick="deleteSupplier(${supplier.supplier_id})"
                                >
                                    Hapus
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


function renderSupplierOptions() {

    const select =
        document.getElementById(
            "supplier-transaksi"
        );


    select.innerHTML = `

        <option value="">
            Tidak ada supplier
        </option>

        ${
            suppliers.map(
                supplier => `
                    <option
                        value="${supplier.supplier_id}"
                    >
                        ${escapeHTML(
                            supplier.nama_supplier
                        )}
                    </option>
                `
            ).join("")
        }

    `;

}


async function saveSupplier(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "supplier-id"
        ).value;


    const data = {

        nama_supplier:
            document.getElementById(
                "nama-supplier"
            ).value.trim(),

        no_telepon:
            document.getElementById(
                "telepon-supplier"
            ).value.trim(),

        alamat:
            document.getElementById(
                "alamat-supplier"
            ).value.trim()

    };


    let result;


    if (id) {

        result =
            await dbClient

                .from("supplier")

                .update(data)

                .eq(
                    "supplier_id",
                    id
                );

    } else {

        result =
            await dbClient

                .from("supplier")

                .insert(data);

    }


    if (result.error) {

        console.error(result.error);

        showToast(
            result.error.message
        );

        return;

    }


    closeModal("supplier-modal");

    resetSupplierForm();

    await loadSuppliers();

    await loadDashboard();


    showToast(
        id
        ?
        "Supplier berhasil diperbarui"
        :
        "Supplier berhasil ditambahkan"
    );

}


function resetSupplierForm() {

    document
        .getElementById(
            "supplier-form"
        )
        .reset();


    document.getElementById(
        "supplier-id"
    ).value = "";


    document.getElementById(
        "supplier-modal-title"
    ).textContent =
        "Tambah Supplier";

}


window.editSupplier =
    function(id) {

        const supplier =
            suppliers.find(
                s =>
                    s.supplier_id == id
            );


        if (!supplier) return;


        document.getElementById(
            "supplier-id"
        ).value =
            supplier.supplier_id;


        document.getElementById(
            "nama-supplier"
        ).value =
            supplier.nama_supplier;


        document.getElementById(
            "telepon-supplier"
        ).value =
            supplier.no_telepon || "";


        document.getElementById(
            "alamat-supplier"
        ).value =
            supplier.alamat || "";


        document.getElementById(
            "supplier-modal-title"
        ).textContent =
            "Edit Supplier";


        openModal(
            "supplier-modal"
        );

    };


window.deleteSupplier =
    async function(id) {

        const yakin =
            confirm(
                "Apakah supplier ini ingin dihapus?"
            );


        if (!yakin) return;


        const {
            error
        } = await dbClient

            .from("supplier")

            .delete()

            .eq(
                "supplier_id",
                id
            );


        if (error) {

            console.error(error);

            showToast(
                "Supplier tidak dapat dihapus"
            );

            return;

        }


        await loadSuppliers();


        showToast(
            "Supplier berhasil dihapus"
        );

    };


// =====================================================
// TRANSACTION
// =====================================================

function initTransactionEvents() {

    document
        .getElementById(
            "btn-tambah-transaksi"
        )
        .addEventListener(
            "click",
            openTransactionModal
        );


    document
        .getElementById(
            "btn-tambah-item"
        )
        .addEventListener(
            "click",
            addTransactionItem
        );


    document
        .getElementById(
            "transaksi-form"
        )
        .addEventListener(
            "submit",
            saveTransaction
        );


    document
        .getElementById(
            "tipe-transaksi"
        )
        .addEventListener(
            "change",
            () => {
                toggleKategoriTransaksi();
                updateTransactionPrices();
            }
        );

    document
        .getElementById("jumlah-bayar-transaksi")
        .addEventListener("input", () => hitungKembalian());

    toggleKategoriTransaksi();

}


function toggleKategoriTransaksi() {

    const isSale = document.getElementById("tipe-transaksi").value === "KELUAR";
    const supplierGroup = document.getElementById("supplier-transaksi-group");
    const customerGroup = document.getElementById("pelanggan-transaksi-group");
    const changeGroup = document.getElementById("kembalian-transaksi-group");
    const paymentFields = document.getElementById("payment-transaksi-group");
    const methodSelect = document.getElementById("metode-pembayaran-transaksi");

    supplierGroup.classList.toggle("hidden", isSale);
    customerGroup.classList.toggle("hidden", !isSale);
    changeGroup.classList.toggle("hidden", !isSale);
    paymentFields.classList.toggle("supplier-payment", !isSale);

    document.getElementById("nama-pelanggan-transaksi").required = isSale;
    methodSelect.required = true;
    document.getElementById("jumlah-bayar-transaksi").required = isSale;
    document.getElementById("jumlah-bayar-opsional").classList.toggle("hidden", isSale);

    [...methodSelect.options].forEach(option => {
        const optionMode = option.dataset.paymentMode;
        option.hidden = Boolean(optionMode && optionMode !== (isSale ? "sale" : "supplier"));
    });

    if (methodSelect.selectedOptions[0]?.hidden) {
        methodSelect.value = "";
    }

    hitungKembalian();

}


function openTransactionModal() {

    document
        .getElementById(
            "transaksi-form"
        )
        .reset();

    document.getElementById("transaksi-edit-id").value = "";
    document.getElementById("transaksi-modal-title").textContent = "Transaksi Baru";
    document.getElementById("transaksi-submit-button").textContent = "Simpan Transaksi";


    document.getElementById(
        "transaction-items"
    ).innerHTML = "";


    addTransactionItem();

    toggleKategoriTransaksi();

    calculateTransactionTotal();


    openModal(
        "transaksi-modal"
    );

}


function addTransactionItem() {

    const container =
        document.getElementById(
            "transaction-items"
        );


    const item =
        document.createElement("div");


    item.className =
        "transaction-item";


    const productOptions =
        products.map(
            product => `
                <option
                    value="${product.produk_id}"
                    data-buy="${product.harga_beli}"
                    data-sell="${product.harga_jual}"
                >
                    ${escapeHTML(
                        product.kode_produk
                    )}
                    -
                    ${escapeHTML(
                        product.nama_produk
                    )}
                    (Stok: ${product.stok})
                </option>
            `
        ).join("");


    item.innerHTML = `

        <div>

            <label>
                Produk
            </label>

            <select class="item-product">

                <option value="">
                    Pilih produk
                </option>

                ${productOptions}

            </select>

        </div>


        <div>

            <label>
                Jumlah
            </label>

            <input
                type="number"
                class="item-quantity"
                min="1"
                value="1"
            >

        </div>


        <div>

            <label>
                Harga
            </label>

            <input
                type="number"
                class="item-price"
                min="0"
                value="0"
            >

        </div>


        <button
            type="button"
            class="remove-item"
            title="Hapus"
        >
            ×
        </button>

    `;


    container.appendChild(item);


    const productSelect =
        item.querySelector(
            ".item-product"
        );


    productSelect.addEventListener(
        "change",
        () => {

            const option =
                productSelect
                    .selectedOptions[0];


            if (!option) return;


            const tipe =
                document.getElementById(
                    "tipe-transaksi"
                ).value;


            const price =
                tipe === "MASUK"
                ?
                option.dataset.buy
                :
                option.dataset.sell;


            item.querySelector(
                ".item-price"
            ).value =
                price || 0;


            calculateTransactionTotal();

        }
    );


    item.querySelector(
        ".item-quantity"
    ).addEventListener(
        "input",
        calculateTransactionTotal
    );


    item.querySelector(
        ".item-price"
    ).addEventListener(
        "input",
        calculateTransactionTotal
    );


    item.querySelector(
        ".remove-item"
    ).addEventListener(
        "click",
        () => {

            item.remove();

            calculateTransactionTotal();

        }
    );

}


function updateTransactionPrices() {

    const tipe =
        document.getElementById(
            "tipe-transaksi"
        ).value;


    document
        .querySelectorAll(
            ".transaction-item"
        )
        .forEach(item => {

            const select =
                item.querySelector(
                    ".item-product"
                );


            const option =
                select.selectedOptions[0];


            if (!option) return;


            const price =
                tipe === "MASUK"
                ?
                option.dataset.buy
                :
                option.dataset.sell;


            item.querySelector(
                ".item-price"
            ).value =
                price || 0;

        });


    calculateTransactionTotal();

}


function calculateTransactionTotal() {

    const total = getTransactionTotal();

    document.getElementById(
        "transaction-total"
    ).textContent = rupiah(total);

    hitungKembalian(total);

    return total;

}


function getTransactionTotal() {

    let total = 0;


    document
        .querySelectorAll(
            ".transaction-item"
        )
        .forEach(item => {

            const quantity =
                Number(
                    item.querySelector(
                        ".item-quantity"
                    ).value
                ) || 0;


            const price =
                Number(
                    item.querySelector(
                        ".item-price"
                    ).value
                ) || 0;


            total +=
                quantity * price;

        });


    return total;

}


function hitungKembalian(total = getTransactionTotal()) {

    const amount = Number(
        document.getElementById("jumlah-bayar-transaksi").value
    ) || 0;
    const change = amount - total;

    document.getElementById("kembalian-transaksi").value = rupiah(change);

}


async function saveTransaction(event) {

    event.preventDefault();

    const editId = Number(
        document.getElementById("transaksi-edit-id").value
    ) || null;
    let originalTransaction = null;

    if (editId) {
        const { data, error } = await dbClient
            .from("transaksi")
            .select("*, detail_transaksi(produk_id, jumlah, harga)")
            .eq("transaksi_id", editId)
            .single();

        if (error || !data) {
            showToast(`Gagal memuat transaksi: ${error?.message || "Transaksi tidak ditemukan."}`);
            return;
        }

        originalTransaction = data;
    }


    const tipe =
        document.getElementById(
            "tipe-transaksi"
        ).value;


    const supplierValue =
        document.getElementById(
            "supplier-transaksi"
        ).value;


    const supplierId =
        tipe === "MASUK" && supplierValue
        ?
        Number(supplierValue)
        :
        null;

    const namaPelanggan = document
        .getElementById("nama-pelanggan-transaksi")
        .value.trim();
    const noTeleponPelanggan = document
        .getElementById("telepon-pelanggan-transaksi")
        .value.trim();
    const metodePembayaran = document
        .getElementById("metode-pembayaran-transaksi")
        .value;
    const jumlahBayarField = document.getElementById("jumlah-bayar-transaksi");
    const jumlahBayar = jumlahBayarField.value.trim() !== ""
        ? jumlahBayarField.valueAsNumber
        : null;


    const keterangan =
        document.getElementById(
            "keterangan-transaksi"
        ).value.trim();

    const total = getTransactionTotal();
    const totalTransaksi = total;

    console.log("DEBUG jumlahBayar:", jumlahBayar, "total:", total);

    if (!metodePembayaran) {
        showToast("Pilih metode pembayaran");
        return;
    }

    if (tipe === "KELUAR") {
        if (!namaPelanggan) {
            showToast("Nama pelanggan wajib diisi");
            return;
        }

        if (jumlahBayar === null || !Number.isFinite(jumlahBayar)) {
            showToast("Masukkan jumlah bayar pelanggan");
            return;
        }

        if (jumlahBayar < totalTransaksi) {
            showToast("Jumlah bayar belum mencukupi total transaksi");
            return;
        }
    } else if (jumlahBayar !== null && (!Number.isFinite(jumlahBayar) || jumlahBayar < 0)) {
        showToast("Jumlah bayar harus bernilai nol atau lebih");
        return;
    }


    const itemElements =
        document.querySelectorAll(
            ".transaction-item"
        );


    if (itemElements.length === 0) {

        showToast(
            "Tambahkan minimal satu produk"
        );

        return;

    }


    const items = [];


    for (
        const element
        of itemElements
    ) {

        const produkId =
            Number(
                element.querySelector(
                    ".item-product"
                ).value
            );


        const jumlah =
            Number(
                element.querySelector(
                    ".item-quantity"
                ).value
            );


        const harga =
            Number(
                element.querySelector(
                    ".item-price"
                ).value
            );


        if (
            !produkId ||
            jumlah <= 0 ||
            harga < 0
        ) {

            showToast(
                "Lengkapi detail transaksi"
            );

            return;

        }


        items.push({

            produk_id:
                produkId,

            jumlah:
                jumlah,

            harga:
                harga

        });

    }


    const transactionFields = {
        tipe_transaksi: tipe,
        supplier_id: supplierId,
        keterangan: keterangan || null,
        total: totalTransaksi,
        nama_pelanggan: tipe === "KELUAR" ? namaPelanggan : null,
        no_telepon_pelanggan: tipe === "KELUAR" ? noTeleponPelanggan || null : null,
        metode_pembayaran: metodePembayaran,
        jumlah_bayar: jumlahBayar,
        kembalian: tipe === "KELUAR" ? Math.max(jumlahBayar - totalTransaksi, 0) : null
    };
    let transactionNumber;

    if (editId) {
        const { error } = await updateExistingTransaction(
            editId,
            originalTransaction,
            transactionFields,
            items
        );

        if (error) {
            console.error(error);
            showToast(error);
            return;
        }

        transactionNumber = originalTransaction.nomor_transaksi;
    } else {
        const { data, error } = await dbClient.rpc(
            "proses_transaksi",
            {
                p_tipe: tipe,
                p_supplier_id: supplierId,
                p_keterangan: keterangan,
                p_items: items,
                p_nama_pelanggan: tipe === "KELUAR" ? namaPelanggan : null,
                p_no_telepon_pelanggan: tipe === "KELUAR" ? noTeleponPelanggan || null : null,
                p_metode_pembayaran: metodePembayaran,
                p_jumlah_bayar: jumlahBayar
            }
        );

console.log("=== RPC DEBUG ===");
console.log("p_items:", JSON.stringify(items));
console.log("p_jumlah_bayar:", jumlahBayar);
console.log("data:", JSON.stringify(data));
console.log("error.message:", error?.message);
console.log("error.details:", error?.details);
console.log("error.hint:", error?.hint);
console.log("error.code:", error?.code);
        if (error) {
            console.error(error);
            showToast(error.message);
            return;
        }

        transactionNumber = data.nomor_transaksi;
    }


    document.getElementById("transaksi-form").reset();
    document.getElementById("transaksi-edit-id").value = "";
    document.getElementById("transaction-items").innerHTML = "";
    document.getElementById("transaksi-modal-title").textContent = "Transaksi Baru";
    document.getElementById("transaksi-submit-button").textContent = "Simpan Transaksi";
    toggleKategoriTransaksi();

    closeModal(
        "transaksi-modal"
    );


    await loadProducts();

    await loadTransactions();

    await loadDashboard();

    await loadReport();


    showToast(
        `Transaksi ${transactionNumber} berhasil ${editId ? "diperbarui" : "disimpan"}`
    );

}


async function calculateTransactionStockChanges(previousTransaction, nextType, nextItems = []) {

    const previousItems = previousTransaction.detail_transaksi || [];
    const productIds = [...new Set([
        ...previousItems.map(item => Number(item.produk_id)),
        ...nextItems.map(item => Number(item.produk_id))
    ])];

    if (productIds.length === 0) {
        return { changes: [], error: null };
    }

    const { data: productRows, error } = await dbClient
        .from("produk")
        .select("produk_id, nama_produk, stok")
        .in("produk_id", productIds);

    if (error) {
        return { changes: [], error: error.message };
    }

    if ((productRows || []).length !== productIds.length) {
        return { changes: [], error: "Sebagian produk transaksi tidak ditemukan." };
    }

    const previousEffects = new Map();
    const nextEffects = new Map();
    const previousDirection = previousTransaction.tipe_transaksi === "MASUK" ? 1 : -1;
    const nextDirection = nextType === "MASUK" ? 1 : nextType === "KELUAR" ? -1 : 0;

    previousItems.forEach(item => {
        const productId = Number(item.produk_id);
        previousEffects.set(
            productId,
            (previousEffects.get(productId) || 0) + previousDirection * Number(item.jumlah)
        );
    });

    nextItems.forEach(item => {
        const productId = Number(item.produk_id);
        nextEffects.set(
            productId,
            (nextEffects.get(productId) || 0) + nextDirection * Number(item.jumlah)
        );
    });

    const changes = [];

    for (const product of productRows) {
        const previousStock = Number(product.stok);
        const nextStock = previousStock
            - (previousEffects.get(Number(product.produk_id)) || 0)
            + (nextEffects.get(Number(product.produk_id)) || 0);

        if (nextStock < 0) {
            return {
                changes: [],
                error: `Stok ${product.nama_produk} tidak cukup untuk perubahan transaksi.`
            };
        }

        if (nextStock !== previousStock) {
            changes.push({
                produkId: Number(product.produk_id),
                previousStock,
                nextStock
            });
        }
    }

    return { changes, error: null };

}


async function restoreProductStocks(changes) {

    let restored = true;

    for (const change of [...changes].reverse()) {
        const { error } = await dbClient
            .from("produk")
            .update({ stok: change.previousStock })
            .eq("produk_id", change.produkId);

        if (error) {
            restored = false;
            console.error("Gagal memulihkan stok:", error);
        }
    }

    return restored;

}


async function applyProductStockChanges(changes) {

    const applied = [];

    for (const change of changes) {
        const { data, error } = await dbClient
            .from("produk")
            .update({ stok: change.nextStock })
            .eq("produk_id", change.produkId)
            .select("produk_id")
            .maybeSingle();

        if (error || !data) {
            await restoreProductStocks(applied);
            return { applied: [], error: error?.message || "Stok produk tidak dapat diperbarui." };
        }

        applied.push(change);
    }

    return { applied, error: null };

}


async function updateExistingTransaction(transactionId, previousTransaction, nextFields, nextItems) {

    const { changes, error: stockPlanError } = await calculateTransactionStockChanges(
        previousTransaction,
        nextFields.tipe_transaksi,
        nextItems
    );

    if (stockPlanError) {
        return { error: stockPlanError };
    }

    const { applied, error: stockUpdateError } = await applyProductStockChanges(changes);

    if (stockUpdateError) {
        return { error: stockUpdateError };
    }

    const previousFields = {
        tipe_transaksi: previousTransaction.tipe_transaksi,
        supplier_id: previousTransaction.supplier_id,
        keterangan: previousTransaction.keterangan,
        total: previousTransaction.total,
        nama_pelanggan: previousTransaction.nama_pelanggan,
        no_telepon_pelanggan: previousTransaction.no_telepon_pelanggan,
        metode_pembayaran: previousTransaction.metode_pembayaran,
        jumlah_bayar: previousTransaction.jumlah_bayar,
        kembalian: previousTransaction.kembalian
    };

    const { data: updatedTransaction, error: headerError } = await dbClient
        .from("transaksi")
        .update(nextFields)
        .eq("transaksi_id", transactionId)
        .select("transaksi_id")
        .maybeSingle();

    if (headerError || !updatedTransaction) {
        await restoreProductStocks(applied);
        return { error: headerError?.message || "Transaksi tidak dapat diperbarui." };
    }

    const { error: deleteDetailsError } = await dbClient
        .from("detail_transaksi")
        .delete()
        .eq("transaksi_id", transactionId);

    if (deleteDetailsError) {
        await dbClient.from("transaksi").update(previousFields).eq("transaksi_id", transactionId);
        await restoreProductStocks(applied);
        return { error: deleteDetailsError.message };
    }

    const replacementDetails = nextItems.map(item => ({
        transaksi_id: transactionId,
        produk_id: item.produk_id,
        jumlah: item.jumlah,
        harga: item.harga
    }));
    const { error: insertDetailsError } = await dbClient
        .from("detail_transaksi")
        .insert(replacementDetails);

    if (insertDetailsError) {
        await dbClient.from("detail_transaksi").delete().eq("transaksi_id", transactionId);
        const originalDetails = (previousTransaction.detail_transaksi || []).map(item => ({
            transaksi_id: transactionId,
            produk_id: item.produk_id,
            jumlah: item.jumlah,
            harga: item.harga
        }));
        const { error: restoreDetailsError } = await dbClient
            .from("detail_transaksi")
            .insert(originalDetails);
        const { error: restoreHeaderError } = await dbClient
            .from("transaksi")
            .update(previousFields)
            .eq("transaksi_id", transactionId);

        await restoreProductStocks(applied);

        if (restoreDetailsError || restoreHeaderError) {
            console.error("Gagal memulihkan transaksi setelah detail gagal disimpan:", {
                restoreDetailsError,
                restoreHeaderError
            });
        }

        return { error: insertDetailsError.message };
    }

    return { error: null };

}


async function editTransaksi(transactionId) {

    const { data: transaction, error } = await dbClient
        .from("transaksi")
        .select("*, detail_transaksi(produk_id, jumlah, harga)")
        .eq("transaksi_id", transactionId)
        .single();

    if (error || !transaction) {
        showToast(`Gagal memuat transaksi: ${error?.message || "Transaksi tidak ditemukan."}`);
        return;
    }

    document.getElementById("transaksi-form").reset();
    document.getElementById("transaction-items").innerHTML = "";
    document.getElementById("transaksi-edit-id").value = transaction.transaksi_id;
    document.getElementById("tipe-transaksi").value = transaction.tipe_transaksi;
    document.getElementById("supplier-transaksi").value = transaction.supplier_id || "";
    document.getElementById("keterangan-transaksi").value = transaction.keterangan || "";
    document.getElementById("nama-pelanggan-transaksi").value = transaction.nama_pelanggan || "";
    document.getElementById("telepon-pelanggan-transaksi").value = transaction.no_telepon_pelanggan || "";
    document.getElementById("metode-pembayaran-transaksi").value = transaction.metode_pembayaran || "";
    document.getElementById("jumlah-bayar-transaksi").value = transaction.jumlah_bayar ?? "";

    (transaction.detail_transaksi || []).forEach(detail => {
        addTransactionItem();
        const rows = document.querySelectorAll(".transaction-item");
        const row = rows[rows.length - 1];
        row.querySelector(".item-product").value = String(detail.produk_id);
        row.querySelector(".item-quantity").value = detail.jumlah;
        row.querySelector(".item-price").value = detail.harga;
    });

    if (!transaction.detail_transaksi?.length) {
        addTransactionItem();
    }

    document.getElementById("transaksi-modal-title").textContent = "Edit Transaksi";
    document.getElementById("transaksi-submit-button").textContent = "Simpan Perubahan";
    toggleKategoriTransaksi();
    calculateTransactionTotal();
    openModal("transaksi-modal");

}


async function deleteTransaksi(transactionId) {

    if (!window.confirm("Yakin hapus transaksi ini?")) {
        return;
    }

    const { data: transaction, error } = await dbClient
        .from("transaksi")
        .select("*, detail_transaksi(produk_id, jumlah)")
        .eq("transaksi_id", transactionId)
        .single();

    if (error || !transaction) {
        showToast(`Gagal memuat transaksi: ${error?.message || "Transaksi tidak ditemukan."}`);
        return;
    }

    const { changes, error: stockPlanError } = await calculateTransactionStockChanges(
        transaction,
        null,
        []
    );

    if (stockPlanError) {
        showToast(stockPlanError);
        return;
    }

    const { applied, error: stockUpdateError } = await applyProductStockChanges(changes);

    if (stockUpdateError) {
        showToast(stockUpdateError);
        return;
    }

    const { data: deletedTransaction, error: deleteError } = await dbClient
        .from("transaksi")
        .delete()
        .eq("transaksi_id", transactionId)
        .select("transaksi_id")
        .maybeSingle();

    if (deleteError || !deletedTransaction) {
        await restoreProductStocks(applied);
        showToast(deleteError?.message || "Transaksi tidak dapat dihapus.");
        return;
    }

    await loadProducts();
    await loadTransactions();
    await loadDashboard();
    await loadReport();
    showToast(`Transaksi ${transaction.nomor_transaksi} berhasil dihapus`);

}


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions() {

    const {
        data,
        error
    } = await dbClient

        .from("transaksi")

        .select("*, supplier(nama_supplier), detail_transaksi(jumlah, harga)")

        .order(
            "transaksi_id",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        document.getElementById(
            "transaksi-table"
        ).innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        Gagal memuat transaksi: ${escapeHTML(error.message)}
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    const tbody =
        document.getElementById(
            "transaksi-table"
        );


    if (!data || data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        Belum ada transaksi.
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        data.map(
            (trx, index) => {

                const total = Number(trx.total) || (trx.detail_transaksi || []).reduce(
                    (sum, detail) => sum + Number(detail.jumlah) * Number(detail.harga),
                    0
                );
                const transactionParty = trx.tipe_transaksi === "KELUAR"
                    ? trx.nama_pelanggan || "Pelanggan Umum"
                    : trx.supplier?.nama_supplier || "-";
                const transactionNumber = String(trx.nomor_transaksi || "");
                const transactionNumberHead = escapeHTML(transactionNumber.slice(0, 18));
                const transactionNumberTail = escapeHTML(transactionNumber.slice(18));

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td class="transaction-number-cell">
                            <strong class="transaction-number-head">${transactionNumberHead}</strong>
                            ${transactionNumberTail
                                ? `<span class="transaction-number-tail">${transactionNumberTail}</span>`
                                : ""}
                        </td>

                        <td>
                            ${formatDate(
                                trx.tanggal
                            )}
                        </td>

                        <td>

                            ${
                                trx.tipe_transaksi
                                === "MASUK"
                                ?
                                `<span class="badge badge-masuk">
                                    Barang Masuk
                                </span>`
                                :
                                `<span class="badge badge-keluar">
                                    Barang Keluar
                                </span>`
                            }

                        </td>

                        <td>
                            ${escapeHTML(
                                transactionParty
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                trx.metode_pembayaran || "-"
                            )}
                        </td>

                        <td>
                            <span class="badge badge-masuk">Lunas</span>
                        </td>

                        <td>
                            <strong>
                                ${rupiah(total)}
                            </strong>
                        </td>

                        <td>
                            <div class="action-group">
                                <button type="button" class="action-btn print-btn" onclick="cetakStruk(${Number(trx.transaksi_id)})" title="Cetak struk" aria-label="Cetak struk">🖨️</button>
                                <button type="button" class="action-btn edit-btn" onclick="editTransaksi(${Number(trx.transaksi_id)})" title="Edit transaksi" aria-label="Edit transaksi">✏️</button>
                                <button type="button" class="action-btn delete-btn" onclick="deleteTransaksi(${Number(trx.transaksi_id)})" title="Hapus transaksi" aria-label="Hapus transaksi">🗑️</button>
                            </div>
                        </td>

                    </tr>
                `;

            }
        ).join("");

}


function cetakStruk(transactionId) {
    return printReceipt(transactionId);
}


async function printReceipt(transactionId) {

    const printWindow = window.open("", "_blank", "width=420,height=700");

    if (!printWindow) {
        showToast("Izinkan pop-up untuk mencetak struk.");
        return;
    }

    const { data: transaction, error } = await dbClient
        .from("transaksi")
        .select("*, supplier(nama_supplier), detail_transaksi(jumlah, harga, subtotal, produk(nama_produk))")
        .eq("transaksi_id", transactionId)
        .single();

    if (error || !transaction) {
        printWindow.close();
        showToast(`Gagal memuat struk: ${error?.message || "Transaksi tidak ditemukan."}`);
        return;
    }

    const details = transaction.detail_transaksi || [];
    const total = Number(transaction.total) || details.reduce(
        (sum, detail) => sum + Number(detail.subtotal || detail.jumlah * detail.harga),
        0
    );
    const paidAmountValue = transaction.jumlah_bayar ?? transaction.bayar ?? transaction.amount_paid;
    const paidAmount = paidAmountValue === undefined || paidAmountValue === null
        ? null
        : Number(paidAmountValue);
    const storedChange = transaction.kembalian ?? transaction.change ?? null;
    const changeAmount = paidAmount !== null && Number.isFinite(paidAmount)
        ? Math.max(paidAmount - total, 0)
        : storedChange;
    const lineItems = details.map(detail => {
        const product = Array.isArray(detail.produk) ? detail.produk[0] : detail.produk;
        const productName = escapeHTML(product?.nama_produk || "Produk");
        const quantity = Number(detail.jumlah) || 0;
        const price = Number(detail.harga) || 0;

        return `
            <div class="receipt-item">
                <div class="receipt-item-name">${productName}</div>
                <div class="receipt-item-detail">
                    <span class="receipt-qty-price">${quantity} x ${rupiah(price)}</span>
                    <span class="receipt-subtotal">${rupiah(Number(detail.subtotal) || quantity * price)}</span>
                </div>
            </div>
        `;
    }).join("");
    const supplier = Array.isArray(transaction.supplier)
        ? transaction.supplier[0]
        : transaction.supplier;
    const isSale = transaction.tipe_transaksi === "KELUAR";
    const receiptDate = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).format(new Date(transaction.created_at || transaction.tanggal));
    const partyRows = isSale
        ? `
            <div class="struk-row"><span class="struk-label">Nama</span><span class="struk-value">${escapeHTML(transaction.nama_pelanggan || "Pelanggan Umum")}</span></div>
            <div class="struk-row"><span class="struk-label">Telp</span><span class="struk-value">${escapeHTML(transaction.no_telepon_pelanggan || "-")}</span></div>
        `
        : `<div class="struk-row"><span class="struk-label">Supplier</span><span class="struk-value">${escapeHTML(supplier?.nama_supplier || "-")}</span></div>`;
    const methodRow = transaction.metode_pembayaran
        ? `<div class="struk-row"><span class="struk-label">Metode</span><span class="struk-value">${escapeHTML(transaction.metode_pembayaran)}</span></div>`
        : "";
    const paymentRows = `
        ${paidAmount === undefined || paidAmount === null ? "" : `
            <div class="struk-row">
                <span class="struk-label">Jumlah Bayar</span>
                <span class="struk-value">${rupiah(Number(paidAmount))}</span>
            </div>
        `}
        ${changeAmount === null ? "" : `
            <div class="struk-row">
                <span class="struk-label">Kembalian</span>
                <span class="struk-value">${rupiah(Number(changeAmount))}</span>
            </div>
        `}
    `;
    const receiptStyles = `
        * { box-sizing: border-box; }
        @page { size: 80mm auto; margin: 0; }
        html, body { min-height: 100%; margin: 0; padding: 0; }
        body.receipt-print {
            width: 100%;
            color: #000;
            background: #edf0eb;
            font-family: "Courier New", monospace;
            font-size: 11px;
            line-height: 1.5;
        }
        .receipt {
            width: 80mm;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .receipt-head { padding-bottom: 10px; border-bottom: 1px dashed #999; text-align: center; }
        .receipt-logo { margin-bottom: 3px; font-size: 18px; line-height: 1; }
        .receipt-head h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 2px; }
        .receipt-head p { margin: 0; }
        .receipt-subtitle { margin-bottom: 6px !important; color: #666; font-size: 10px; }
        .receipt-title { margin: 12px 0 4px; text-align: center; font-size: 12px; font-weight: 700; }
        .struk-section { padding: 8px 0; border-bottom: 1px dashed #999; }
        .struk-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .struk-label { flex: 0 0 35%; color: #444; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .struk-value { flex: 1; min-width: 0; text-align: right; overflow-wrap: anywhere; }
        .receipt-items-head { margin-bottom: 4px; color: #444; font-size: 10px; font-weight: 700; }
        .receipt-item { padding: 5px 0; overflow-wrap: anywhere; }
        .receipt-item-name { font-weight: 700; }
        .receipt-item-detail { display: flex; justify-content: space-between; gap: 8px; }
        .receipt-qty-price { min-width: 0; overflow-wrap: anywhere; }
        .receipt-subtotal { flex: 0 0 auto; text-align: right; }
        .receipt-summary .struk-row:last-child { padding-top: 3px; }
        .receipt-total .struk-label, .receipt-total .struk-value { color: #000; font-size: 12px; font-weight: 700; }
        .receipt-foot { padding-top: 12px; color: #444; text-align: center; font-size: 10px; font-style: italic; }
        .receipt-foot p { margin: 0; }
        @media screen {
            body.receipt-print { width: 100%; min-height: 100vh; padding: 18px 0; }
            .receipt { box-shadow: 0 4px 18px rgba(25, 35, 28, 0.16); }
        }
        @media print {
            html, body.receipt-print { width: 80mm; min-width: 80mm; min-height: 0; padding: 0; background: #fff; color: #000; }
            .receipt { width: 80mm; max-width: none; margin: 0; padding: 5mm; box-shadow: none; }
        }
    `;

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Struk ${escapeHTML(transaction.nomor_transaksi)}</title>
            <style>${receiptStyles}</style>
        </head>
        <body class="receipt-print">
            <main class="receipt">
                <header class="receipt-head">
                    <div class="receipt-logo">💄</div>
                    <h1>GlowStock</h1>
                    <p class="receipt-subtitle">Sistem Persediaan Kosmetik</p>
                    <p>Jl. Kosmetik Indah No. 123, Bandung</p>
                    <p>Telp: 085712345432</p>
                </header>
                <div class="receipt-title">${isSale ? "STRUK PEMBELIAN" : "STRUK PEMASUKAN"}</div>
                <section class="struk-section">
                    <div class="struk-row"><span class="struk-label">No. Struk</span><span class="struk-value">${escapeHTML(transaction.nomor_transaksi)}</span></div>
                    <div class="struk-row"><span class="struk-label">Tanggal</span><span class="struk-value">${receiptDate}</span></div>
                    ${methodRow}
                </section>
                <section class="struk-section">
                    ${partyRows}
                </section>
                <section class="struk-section receipt-items">
                    <div class="receipt-items-head">RINCIAN PRODUK</div>
                    ${lineItems}
                </section>
                <section class="struk-section receipt-summary">
                    <div class="struk-row receipt-total"><span class="struk-label">Total</span><span class="struk-value">${rupiah(total)}</span></div>
                    ${paymentRows}
                </section>
                <footer class="receipt-foot">
                    <p>Setiap produk adalah awal</p>
                    <p>perjalanan kecantikanmu.</p>
                    <p>Terima kasih telah mempercayai GlowStock 💄</p>
                    <p>Selamat Berbelanja ✨</p>
                </footer>
            </main>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 350);

}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    const metricIds = [
        "total-produk",
        "total-stok",
        "nilai-persediaan",
        "total-transaksi"
    ];

    metricIds.forEach(id => {
        document.getElementById(id).textContent = "...";
    });

    const {
        data: productData,
        error: productError
    } = await dbClient

        .from("produk")

        .select(
            "produk_id, stok, harga_beli, stok_minimum, kode_produk, nama_produk"
        );


    if (productError) {

        console.error(productError);

        metricIds.forEach(id => {
            document.getElementById(id).textContent = "-";
        });

        showToast(
            `Gagal memuat produk: ${productError.message}`
        );

        return;

    }


    const productsDashboard =
        productData || [];

    await initCharts();


    const totalProduk =
        productsDashboard.length;


    const totalStok =
        productsDashboard.reduce(
            (sum, product) =>
                sum + Number(product.stok),
            0
        );


    const nilaiPersediaan =
        productsDashboard.reduce(
            (sum, product) =>
                sum +
                (
                    Number(product.stok)
                    *
                    Number(product.harga_beli)
                ),
            0
        );


    document.getElementById(
        "total-produk"
    ).textContent =
        totalProduk;


    document.getElementById(
        "total-stok"
    ).textContent =
        totalStok;


    document.getElementById(
        "nilai-persediaan"
    ).textContent =
        rupiah(nilaiPersediaan);


    const {
        count: totalTransaksi,
        error: transactionError
    } = await dbClient

        .from("transaksi")

        .select(
            "transaksi_id",
            {
                count: "exact",
                head: true
            }
        );


    if (transactionError) {

        console.error(transactionError);

        document.getElementById(
            "total-transaksi"
        ).textContent = "-";

        showToast(
            `Gagal memuat transaksi: ${transactionError.message}`
        );

        return;

    }


    document.getElementById(
        "total-transaksi"
    ).textContent =
        totalTransaksi || 0;


    renderLowStock(
        productsDashboard
    );


    loadRecentTransactions();

}


async function initCharts() {

    const categories = ["Makeup", "Skincare", "Bodycare", "Haircare"];
    const colors = ["#e9788e", "#31574e", "#d5a943", "#5c91a0"];
    const { data, error } = await dbClient
        .from("produk")
        .select("kategori, stok");

    if (error) {
        console.error("Gagal memuat data chart:", error);
        return;
    }

    const totalsByCategory = Object.fromEntries(
        categories.map(category => [category.toLowerCase(), { stok: 0, jumlah: 0 }])
    );

    (data || []).forEach(product => {
        const category = String(product.kategori || "").trim().toLowerCase();
        if (totalsByCategory[category]) {
            totalsByCategory[category].stok += Number(product.stok) || 0;
            totalsByCategory[category].jumlah += 1;
        }
    });

    if (!window.Chart) {
        console.error("Chart.js tidak termuat. Periksa koneksi internet.");
        return;
    }

    chartTrenStok?.destroy();
    chartKategori?.destroy();

    chartTrenStok = new Chart(
        document.getElementById("chart-tren-stok"),
        {
            type: "line",
            data: {
                labels: categories,
                datasets: [{
                    label: "Total Stok",
                    data: categories.map(category => totalsByCategory[category.toLowerCase()].stok),
                    borderColor: colors[1],
                    backgroundColor: "rgba(49, 87, 78, 0.12)",
                    pointBackgroundColor: colors,
                    pointBorderColor: colors,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        }
    );

    chartKategori = new Chart(
        document.getElementById("chart-kategori"),
        {
            type: "doughnut",
            data: {
                labels: categories,
                datasets: [{
                    data: categories.map(category => totalsByCategory[category.toLowerCase()].jumlah),
                    backgroundColor: colors,
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { usePointStyle: true, padding: 18 }
                    }
                }
            }
        }
    );

    updateChartTheme();

}


function renderLowStock(data) {

    const container =
        document.getElementById(
            "low-stock-list"
        );


    const lowStock =
        data.filter(
            product =>
                product.stok
                <= product.stok_minimum
        );


    if (lowStock.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                ${data.length === 0
                    ? "Belum ada produk. Tambahkan produk untuk mulai memantau stok."
                    : "Semua stok masih aman ✨"
                }
            </div>
        `;

        return;

    }


    container.innerHTML =
        lowStock
            .slice(0, 5)
            .map(
                product => `

                    <div class="low-stock-item">

                        <div>

                            <div class="product-name">
                                ${escapeHTML(
                                    product.nama_produk
                                )}
                            </div>

                            <div class="product-code">
                                ${escapeHTML(
                                    product.kode_produk
                                )}
                            </div>

                        </div>

                        <span class="stock-danger">
                            Stok ${product.stok}
                        </span>

                    </div>

                `
            )
            .join("");

}


async function loadRecentTransactions() {

    const {
        data,
        error
    } = await dbClient

        .from("transaksi")

        .select("*, supplier(nama_supplier)")

        .order(
            "transaksi_id",
            {
                ascending: false
            }
        )

        .limit(5);


    if (error) {

        console.error(error);

        document.getElementById(
            "recent-transactions"
        ).innerHTML = `
            <div class="empty-state">
                Gagal memuat transaksi: ${escapeHTML(error.message)}
            </div>
        `;

        return;

    }


    const container =
        document.getElementById(
            "recent-transactions"
        );


    if (!data || data.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada transaksi.
            </div>
        `;

        return;

    }


    container.innerHTML =
        data.map(
            trx => `

                <div class="recent-item">

                    <div>

                        <div class="product-name">
                            ${escapeHTML(
                                trx.nomor_transaksi
                            )}
                        </div>

                        <div class="product-code">
                            ${formatDate(
                                trx.tanggal
                            )}
                        </div>

                    </div>


                    <div>

                        ${
                            trx.tipe_transaksi
                            === "MASUK"
                            ?
                            `<span class="badge badge-masuk">
                                Masuk
                            </span>`
                            :
                            `<span class="badge badge-keluar">
                                Keluar
                            </span>`
                        }

                    </div>

                </div>

            `
        ).join("");

}


// =====================================================
// REPORT
// =====================================================

async function loadReport() {

    const {
        data,
        error
    } = await dbClient

        .from("produk")

        .select("produk_id, kode_produk, nama_produk, kategori, stok, harga_beli")

        .order("nama_produk");


    if (error) {

        console.error(error);

        document.getElementById(
            "laporan-table"
        ).innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        Gagal memuat laporan: ${escapeHTML(error.message)}
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    const tbody =
        document.getElementById(
            "laporan-table"
        );


    if (!data || data.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        Belum ada data persediaan.
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        data.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.kode_produk
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                item.nama_produk
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(
                            item.kategori
                        )}
                    </td>

                    <td>
                        ${item.stok}
                    </td>

                    <td>
                        ${rupiah(
                            item.harga_beli
                        )}
                    </td>

                    <td>
                        <strong>
                            ${rupiah(
                                Number(item.stok) * Number(item.harga_beli)
                            )}
                        </strong>
                    </td>

                </tr>

            `
        ).join("");

}


// =====================================================
// UTILITY
// =====================================================

function formatDate(date) {

    if (!date) return "-";


    return new Date(
        date + "T00:00:00"
    ).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHTML(value) {

    if (value === null || value === undefined) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}