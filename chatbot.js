// ============================================================
//  RAGHAD Store – AI Chatbot
//  Primary: Google Gemini 2.0 Flash (1M token/day free)
//  Fallback: Groq Llama (100K token/day free)
// ============================================================

const GEMINI_API_KEY = "AIzaSyBt-8b5tzm6U9mUCT6GhBE9A4EedC8jgGU";
const GEMINI_MODEL   = "gemini-2.0-flash";

const GROQ_API_KEY   = "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";
const GROQ_MODELS    = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

const WHATSAPP_NUM   = "201002758295";

// ─── Complexity Routing (لاستخدام الموديلات الثقيلة بذكاء) ────
function getComplexity(text) {
    const hard   = ["مشكل","حساسي","تجاعيد","علاج","روتين","تالف","متقصف","دهني","جاف","حبوب","احمرار","بقع","هالات","انتفاخ","تساقط","ضعيف","ينفع","أنصحني"];
    const medium = ["أحسن","أنسب","الفرق","أقارن","أختار","أفضل","مختلف","يناسب","بشرة","شعر","مرطب","كريم","سيروم","ماسك","شامبو"];
    if (hard.some(w => text.includes(w)))   return "hard";
    if (medium.some(w => text.includes(w))) return "medium";
    return "simple";
}

// ─── Response Cache ───────────────────────────────────────────
const responseCache = new Map();
function getCacheKey(t) { return t.trim().toLowerCase().replace(/\s+/g," ").slice(0,60); }
function getCached(t)   { return responseCache.get(getCacheKey(t)) || null; }
function setCache(t, r) {
    responseCache.set(getCacheKey(t), r);
    if (responseCache.size > 50) responseCache.delete(responseCache.keys().next().value);
}

// ─── Quality Check ────────────────────────────────────────────
function isGoodReply(r) {
    if (!r || r.length < 20) return false;
    if (/I (don't|cannot|can't)/i.test(r)) return false;
    const ar = (r.match(/[\u0600-\u06FF]/g)||[]).length;
    if (ar < 5 && r.length > 60) return false;
    return true;
}

// ─── Product Database ─────────────────────────────────────────
const PRODUCTS_DB = [
    { en:"Pure Radiance",   ar:"بيور راديانس",   type:"Serum",        price:450, desc:"سيروم تفتيح، فيتامين C + نياسيناميد، يوحّد لون البشرة." },
    { en:"HydraGlow",       ar:"هيدرا جلو",       type:"Face Cream",   price:380, desc:"جل كريم مرطب 24 ساعة، هيالورونيك أسيد." },
    { en:"Silk Elixir",     ar:"سيلك إليكسير",   type:"Hair Oil",     price:520, desc:"زيت شعر بالأرغان والحرير، لمعة وحماية من الحرارة." },
    { en:"Youth Revive",    ar:"يوث ريفايف",      type:"Night Cream",  price:600, desc:"كريم ليلي مضاد للشيخوخة، ريتينول + ببتيدات." },
    { en:"Aqua Mist",       ar:"أكوا ميست",       type:"Face Mist",    price:250, desc:"بخاخ ماء الورد، ترطيب وتثبيت مكياج." },
    { en:"Botanical Bliss", ar:"بوتانيكال بليس",  type:"Clay Mask",    price:320, desc:"ماسك طين، ينظف المسام ويوازن الزيوت." },
    { en:"Keratin Boost",   ar:"كيراتين بوست",    type:"Shampoo",      price:410, desc:"شامبو كيراتين، يعالج الشعر التالف والمتقصف." },
    { en:"Caviar Eye",      ar:"كافيار آي",        type:"Eye Cream",    price:750, desc:"كريم عيون بالكافيار، يمحو الهالات والانتفاخات." },
    { en:"Velvet Touch",    ar:"فيلفيت تاتش",     type:"Body Lotion",  price:290, desc:"لوشن جسم بزبدة الشيا، ترطيب ونعومة فائقة." },
    { en:"Argan Miracle",   ar:"أرجان ميراكل",    type:"Hair Mask",    price:480, desc:"ماسك أرغان مكثف، يعالج الشعر الجاف والمتقصف." },
];

const OFFERS = [
    "خصم 15% على أي منتجين من منتجات الشعر معاً",
    "خصم 10% على أول طلب لعميل جديد",
    "شراء يوث ريفايف + كافيار آي = أكوا ميست هدية مجانية",
];

// ─── System Prompt ────────────────────────────────────────────
function buildSystemPrompt() {
    const prods  = PRODUCTS_DB.map(p => `• ${p.ar} (${p.en}) | ${p.price} ج.م — ${p.desc}`).join("\n");
    const offers = OFFERS.map(o => `- ${o}`).join("\n");
    return `أنتِ "لينا"، مستشارة العناية بالبشرة والشعر في متجر رغد.
تتحدثين باللغة العربية الفصيحة الواضحة، بأسلوب دافئ وموجز (جملتان إلى ثلاث كحدٍّ أقصى).

== قواعد أساسية ==
1. لا تخرجي عن نطاق منتجات المتجر والعناية بالبشرة والشعر.
2. لا تختلقي منتجاتٍ أو أسعاراً غير موجودة.
3. إذا عرّف العميل عن نفسه أو ذكر اسمه → رحّبي فقط دون تفسير الاسم كمنتج أو أي شيء آخر.
4. لا تفترضي جنس العميل (ذكر/أنثى) حتى يُخبرك صراحةً.
5. الردود مختصرة ومباشرة دائماً.

== قواعد الخصومات ==
- خصم 15% على منتجات الشعر (منتجَين فأكثر): يُطبَّق على مجموع منتجات الشعر أولاً.
- خصم 10% للعميل الجديد: يُطبَّق على الإجمالي بعد خصم الشعر.
- يمكن الجمع بين الخصمَين.
- عند السؤال عن الإجمالي النهائي احسبي خطوة بخطوة:
  المجموع الأصلي → ناقص خصم الشعر → ناقص خصم العميل الجديد = الإجمالي النهائي.

== المنتجات ==
${prods}

== العروض ==
${offers}

عند رغبة العميل في الشراء، أخبريه بأن زر الطلب سيظهر أمامه في المحادثة.`;
}

// ─── Cart ─────────────────────────────────────────────────────
const sessionCart = [];
function updateCart(productName) {
    const p = PRODUCTS_DB.find(p => p.ar === productName || p.en === productName);
    if (p && !sessionCart.find(c => c.ar === p.ar)) sessionCart.push({ ...p, qty: 1 });
}
function getCartTotal() { return sessionCart.reduce((s, p) => s + p.price * p.qty, 0); }

// يستخرج كل المنتجات المذكورة في النص، يحدّث السلة، ويعيد أول منتج
function extractAndUpdateCart(text) {
    let first = null;
    for (const p of PRODUCTS_DB) {
        if (text.includes(p.ar) || text.includes(p.en)) {
            updateCart(p.ar);
            if (!first) first = p.ar;
        }
    }
    return first;
}

// ─── Gemini History (separate format) ────────────────────────
const geminiHistory = [];   // [{role:"user"|"model", parts:[{text:"..."}]}]

// ─── Groq History (OpenAI format) ────────────────────────────
const groqHistory = [{ role: "system", content: buildSystemPrompt() }];

// ─── Call Gemini (Primary) ────────────────────────────────────
async function callGemini(userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    geminiHistory.push({ role: "user", parts: [{ text: userMessage }] });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: buildSystemPrompt() }] },
            contents: geminiHistory,
            generationConfig: { maxOutputTokens: 250, temperature: 0.75 }
        })
    });

    if (!response.ok) {
        geminiHistory.pop();
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini HTTP ${response.status}`);
    }

    const data  = await response.json();
    const reply = data.candidates[0].content.parts[0].text.trim();
    geminiHistory.push({ role: "model", parts: [{ text: reply }] });
    return reply;
}

// ─── Call Groq (Fallback) ─────────────────────────────────────
async function callGroq(userMessage) {
    const complexity = getComplexity(userMessage);
    const models     = complexity === "simple"
        ? ["llama-3.1-8b-instant"]
        : GROQ_MODELS;

    groqHistory.push({ role: "user", content: userMessage });

    for (const model of models) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({ model, messages: groqHistory, temperature: 0.75, max_tokens: 200 })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                const msg = err?.error?.message || `HTTP ${response.status}`;
                if (response.status === 429 || msg.includes("decommissioned")) { continue; }
                throw new Error(msg);
            }

            const data  = await response.json();
            const reply = data.choices[0].message.content.trim();
            if (!isGoodReply(reply)) continue;
            groqHistory.push({ role: "assistant", content: reply });
            return reply;
        } catch { continue; }
    }

    groqHistory.pop();
    throw new Error("كل النماذج غير متاحة حالياً");
}

// ─── Main AI Router ───────────────────────────────────────────
async function callAI(userMessage) {
    // 1) Cache check
    const cached = getCached(userMessage);
    if (cached) { console.log("✅ Cache hit"); return { reply: cached + " ✨", provider: "cache" }; }

    // 2) Gemini أولاً (1M token/day)
    try {
        console.log("🌟 Trying Gemini...");
        const reply = await callGemini(userMessage);
        if (isGoodReply(reply)) {
            setCache(userMessage, reply);
            console.log("✅ Gemini success");
            return { reply, provider: "gemini" };
        }
    } catch (e) {
        console.warn("⚠️ Gemini failed:", e.message, "→ trying Groq...");
    }

    // 3) Groq كـ fallback
    try {
        console.log("🔄 Trying Groq fallback...");
        const reply = await callGroq(userMessage);
        setCache(userMessage, reply);
        console.log("✅ Groq fallback success");
        return { reply, provider: "groq" };
    } catch (e) {
        throw new Error("جميع الخدمات متوقفة مؤقتاً، حاول بعد قليل 🙏");
    }
}

// ─── UI Helpers ───────────────────────────────────────────────
const messagesEl = document.getElementById("chatbot-messages");

function appendMsg(text, sender, productName = null, provider = null) {
    const div = document.createElement("div");
    div.className = `msg msg-${sender}`;
    div.innerHTML = text.replace(/\n/g, "<br>");

    // مؤشر الـ Provider (للبوت فقط)
    if (sender === "bot" && provider) {
        const badge = document.createElement("div");
        badge.style.cssText = "font-size:0.65rem;margin-top:5px;opacity:0.5;direction:ltr;text-align:left;";
        const icons = { gemini: "🔵 Gemini", groq: "🟡 Groq", cache: "⚡ Cache" };
        badge.textContent = icons[provider] || provider;
        div.appendChild(badge);
    }

    if (productName) updateCart(productName);

    if (productName) {
        const btn = document.createElement("button");
        btn.className = "chat-order-btn";

        const buildMsg = () => {
            if (sessionCart.length > 1) {
                const lines = sessionCart.map(p => `🛍️ ${p.ar} × ${p.qty} = ${p.price * p.qty} ج.م`).join("%0A");
                return `مرحباً متجر رغد! ✨%0Aأود طلب المنتجات التالية:%0A%0A${lines}%0A%0A💰 *الإجمالي: ${getCartTotal()} ج.م*%0A%0Aأرجو تفاصيل التوصيل 🙏`;
            }
            const p = PRODUCTS_DB.find(x => x.ar === productName || x.en === productName);
            return `مرحباً متجر رغد! ✨%0Aأود طلب:%0A%0A🛍️ *${productName}*%0A💰 ${p?.price || ""} ج.م%0A%0Aأرجو تفاصيل التوصيل 🙏`;
        };

        btn.innerHTML = sessionCart.length > 1
            ? `<i class="fab fa-whatsapp"></i> إتمام الطلب (${sessionCart.length} منتجات — ${getCartTotal()} ج.م)`
            : `<i class="fab fa-whatsapp"></i> اطلب ${productName} الآن`;

        btn.addEventListener("click", () => window.open(`https://wa.me/${WHATSAPP_NUM}?text=${buildMsg()}`, "_blank"));
        div.appendChild(document.createElement("br"));
        div.appendChild(btn);
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
    const el = document.createElement("div");
    el.className = "typing-indicator"; el.id = "typing-el";
    el.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}
function removeTyping() { document.getElementById("typing-el")?.remove(); }

// ─── Send Message ─────────────────────────────────────────────
const inputEl = document.getElementById("chatbot-input");
const sendBtn = document.getElementById("chatbot-send");

async function sendMessage() {
    const txt = inputEl.value.trim();
    if (!txt) return;
    inputEl.value = ""; sendBtn.disabled = true;

    appendMsg(txt, "user");
    showTyping();

    try {
        const result  = await callAI(txt);
        removeTyping();
        const product = extractAndUpdateCart(result.reply);
        appendMsg(result.reply, "bot", product, result.provider);
        document.querySelector(".chat-badge").style.display = "none";
    } catch (e) {
        removeTyping();
        appendMsg(`⚠️ ${e.message}`, "bot");
    }

    sendBtn.disabled = false;
    inputEl.focus();
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

// ─── Toggle Chat ──────────────────────────────────────────────
const bubble  = document.getElementById("chatbot-bubble");
const chatWin = document.getElementById("chatbot-window");
let isOpen = false, greeted = false;

bubble.addEventListener("click", () => {
    isOpen = !isOpen;
    chatWin.classList.toggle("chatbot-hidden", !isOpen);
    document.querySelector(".chat-badge").style.display = "none";

    if (isOpen && !greeted) {
        greeted = true;
        setTimeout(async () => {
            showTyping();
            try {
                const result = await callAI("قدّمي نفسك للعميل بجملتين وسليه عن احتياجه.");
                removeTyping();
                appendMsg(result.reply, "bot", null, result.provider);
            } catch {
                removeTyping();
                appendMsg("أهلاً بك! 🌸 أنا لينا، مستشارتك في متجر رغد. كيف يمكنني مساعدتك اليوم؟", "bot");
            }
        }, 300);
    }
});

document.getElementById("chatbot-close").addEventListener("click", () => {
    isOpen = false;
    chatWin.classList.add("chatbot-hidden");
});
