document.addEventListener('DOMContentLoaded', () => {
    
    // Database of products with Phonetic Arabic translations
    const products = [
        { 
            id: 1, 
            image: "assets/1.png", 
            en_name: "Pure Radiance", 
            ar_name: "بيور راديانس", 
            category: "Serum",
            price: 450 
        },
        { 
            id: 2, 
            image: "assets/2.png", 
            en_name: "HydraGlow", 
            ar_name: "هيدرا جلو", 
            category: "Face Cream",
            price: 380 
        },
        { 
            id: 3, 
            image: "assets/3.png", 
            en_name: "Silk Elixir", 
            ar_name: "سيلك إليكسير", 
            category: "Hair Care",
            price: 520 
        },
        { 
            id: 4, 
            image: "assets/4.png", 
            en_name: "Youth Revive", 
            ar_name: "يوث ريفايف", 
            category: "Anti-Aging",
            price: 600 
        },
        { 
            id: 5, 
            image: "assets/5.png", 
            en_name: "Aqua Mist", 
            ar_name: "أكوا ميست", 
            category: "Face Mist",
            price: 250 
        },
        { 
            id: 6, 
            image: "assets/6.png", 
            en_name: "Botanical Bliss", 
            ar_name: "بوتانيكال بليس", 
            category: "Face Mask",
            price: 320 
        },
        { 
            id: 7, 
            image: "assets/7.png", 
            en_name: "Keratin Boost", 
            ar_name: "كيراتين بوست", 
            category: "Hair Care",
            price: 410 
        },
        { 
            id: 8, 
            image: "assets/8.png", 
            en_name: "Caviar Eye", 
            ar_name: "كافيار آي", 
            category: "Eye Cream",
            price: 750 
        },
        { 
            id: 9, 
            image: "assets/9.png", 
            en_name: "Velvet Touch", 
            ar_name: "فيلفيت تاتش", 
            category: "Body Care",
            price: 290 
        },
        { 
            id: 10, 
            image: "assets/10.png", 
            en_name: "Argan Miracle", 
            ar_name: "أرجان ميراكل", 
            category: "Hair Care",
            price: 480 
        }
    ];

    const productsGrid = document.getElementById('productsGrid');
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close-btn');

    // DOM Elements for Modal Content
    const modalImg = document.getElementById('modalImg');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitleAr = document.getElementById('modalTitleAr');
    const modalTitleEn = document.getElementById('modalTitleEn');
    const modalPrice = document.getElementById('modalPrice');

    // Add WhatsApp checkout functionality
    const checkoutBtn = document.querySelector('.modal-details .primary-btn');
    const storeWhatsAppNumber = "201002758295"; // رقم واتساب متجر رغد

    let currentProduct = null;

    // Open Modal Function
    function openModal(product) {
        currentProduct = product;
        modalImg.src = product.image;
        modalCategory.textContent = product.category;
        modalTitleAr.textContent = product.ar_name;
        modalTitleEn.textContent = product.en_name;
        modalPrice.textContent = `${product.price} ج.م`;
        
        modal.classList.add('show');
    }

    // Handle WhatsApp Checkout
    checkoutBtn.addEventListener('click', () => {
        if (!currentProduct) return;
        
        const message = `مرحباً متجر رغد! ✨%0Aأود طلب هذا المنتج:%0A%0A🛍️ *${currentProduct.ar_name}* (${currentProduct.en_name})%0A💰 السعر: ${currentProduct.price} ج.م%0A%0Aالرجاء إخباري بتفاصيل التوصيل والدفع.`;
        const whatsappUrl = `https://wa.me/${storeWhatsAppNumber}?text=${message}`;
        
        window.open(whatsappUrl, '_blank');
    });

    // Close Modal Function
    function closeModal() {
        modal.classList.remove('show');
    }

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Render products
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image" title="عرض التفاصيل">
                <img src="${product.image}" alt="${product.en_name}" loading="lazy">
            </div>
            <div class="product-info">
                <div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-title-ar">${product.ar_name}</div>
                    <div class="product-title-en">${product.en_name}</div>
                </div>
                <div>
                    <div class="product-price">${product.price} ج.م</div>
                    <button class="add-to-cart">
                        <i class="fas fa-shopping-cart"></i> تفاصيل / شراء
                    </button>
                </div>
            </div>
        `;
        
        // Add click listener to image and button to open modal
        card.querySelector('.product-image').addEventListener('click', () => openModal(product));
        card.querySelector('.add-to-cart').addEventListener('click', () => openModal(product));

        productsGrid.appendChild(card);
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
