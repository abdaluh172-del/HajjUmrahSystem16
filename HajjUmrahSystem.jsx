import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, MessageSquareText, MessagesSquare, BarChart3, FileText,
  Users, Settings, User, LogOut, Moon, Sun, Globe, Bell, Search, Filter,
  Download, Trash2, Eye, Edit3, Copy, X, Mic, Upload, ClipboardPaste,
  Sparkles, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight,
  Menu, ShieldCheck, Database, Cloud, KeyRound, Lock, ArrowRight, ArrowLeft,
  Star, Flame, ThumbsUp, ThumbsDown, Tags, RefreshCw, CheckCircle2
} from "lucide-react";

/* ============================== I18N ============================== */
const translations = {
  en: {
    appName: "Hajj & Umrah", appSub: "Sentiment Analysis System",
    welcomeBack: "Welcome Back", signInSub: "Please sign in to your account",
    email: "Email Address", password: "Password", rememberMe: "Remember me",
    forgotPassword: "Forgot Password?", signIn: "Sign In", or: "or",
    signInGoogle: "Sign in with Google", noAccount: "Don't have an account?",
    signUp: "Sign up", loginHeadline: "Analyzing pilgrims' feedback to improve services and enhance the Hajj & Umrah experience.",
    dashboard: "Dashboard", analyzeComment: "Analyze Comment", comments: "Comments",
    analytics: "Analytics", reports: "Reports", users: "Users", profile: "Profile",
    settings: "Settings", logout: "Logout",
    totalComments: "Total Comments", positive: "Positive", negative: "Negative", neutral: "Neutral",
    ofTotal: "of total", vsLastMonth: "vs last month",
    sentimentDistribution: "Sentiment Distribution", sentimentOverTime: "Sentiment Over Time",
    sentimentByCategory: "Sentiment by Category", recentComments: "Recent Comments",
    topKeywords: "Top Keywords", topCategories: "Top Categories",
    mostPositiveService: "Most Positive Service", mostNegativeService: "Most Negative Service",
    avgSatisfaction: "Average Satisfaction", serviceRanking: "Service Ranking",
    dailyAnalysis: "Daily", weeklyAnalysis: "Weekly", monthlyAnalysis: "Monthly",
    viewAll: "View all", category: "Category", date: "Date", sentiment: "Sentiment",
    actions: "Actions", search: "Search comments...", allSentiments: "All Sentiments",
    allCategories: "All Categories", allDates: "All Dates", exportCsv: "Export CSV",
    exportExcel: "Export Excel", exportPdf: "Export PDF", delete: "Delete", edit: "Edit",
    view: "View", duplicate: "Duplicate", showing: "Showing", of: "of", perPage: "per page",
    enterComment: "Enter Comment", writeComment: "Write or paste a pilgrim comment here (Arabic or English)...",
    analyze: "Analyze", clear: "Clear", paste: "Paste", uploadFile: "Upload File",
    voiceInput: "Voice Input", listening: "Listening...", analyzing: "Analyzing...",
    analysisResult: "Analysis Result", confidenceScore: "Confidence Score",
    sentimentScores: "Sentiment Scores", reasonOfPrediction: "Reason of Prediction",
    keywordsDetected: "Keywords Detected", aiRecommendation: "AI Recommendation",
    autoReply: "Suggested Auto-Reply", copyReply: "Copy Reply", analyzedComment: "Analyzed Comment",
    analyzeAnother: "Analyze Another Comment", noKeywords: "No strong sentiment keywords detected.",
    howItWorks: "How it works", step1: "Enter Comment", step1d: "Type or paste any comment about Hajj & Umrah services.",
    step2: "AI Analysis", step2d: "Our system analyzes the text using keyword & pattern models.",
    step3: "Get Result", step3d: "View sentiment results and detailed insights instantly.",
    dailyStats: "Daily Statistics", weeklyStats: "Weekly Statistics", monthlyStats: "Monthly Statistics",
    mostFrequentWords: "Most Frequent Words (Word Cloud)", sentimentTrends: "Sentiment Trends",
    categoryComparison: "Category Comparison", topServices: "Top Services", worstServices: "Worst Services",
    aiInsights: "AI Insights", predictions: "Predictions", heatMap: "Service Heat Map",
    generateReport: "Generate Report", reportType: "Report Type", custom: "Custom", export: "Export",
    reportSummary: "Summary", reportRecommendations: "Recommendations", print: "Print / Save PDF",
    addUser: "Add User", role: "Role", admin: "Admin", user: "User", manager: "Manager", viewer: "Viewer",
    guest: "Guest", continueAsGuest: "Continue as Guest",
    adminOnly: "This page is for admins only", adminOnlySub: "Sign in with the admin account to access user management.",
    protectedAccount: "Protected primary account — cannot be deleted or demoted",
    guestBanner: "You are browsing as a guest — view only. Create an account to add comments.",
    loginFailed: "Invalid login credentials",
    name: "Name", save: "Save Changes", theme: "Theme", light: "Light", dark: "Dark",
    language: "Language", notifications: "Notifications", systemSettings: "System Settings",
    aiSettings: "AI Settings", exportSettings: "Export Settings", backupDb: "Backup Database",
    restoreDb: "Restore Database", security: "Security", jwt: "JWT Authentication",
    rbac: "Role-Based Access Control", pwEnc: "Password Encryption", sessionTimeout: "Session Timeout",
    auditLogs: "Audit Logs", enabled: "Enabled", backendNote: "Requires a real backend service",
    warningHighNeg: "High negative comments detected this week.", excellentWeek: "Excellent performance this week — mostly positive feedback!",
    thankPositive: "Thank the visitor and keep maintaining service quality.",
    investigateNegative: "Investigate the reported issue and increase staff support in this area.",
    collectNeutral: "Collect more detailed feedback to understand the visitor's experience better.",
    replyPositive: "Thank you for your kind feedback — we're delighted you had a great experience!",
    replyNegative: "We appreciate your feedback and sincerely apologize. The issue will be reviewed and service improved.",
    replyNeutral: "Thank you for sharing your experience. We'd love to hear more details from you.",
    smartSearchHint: "Smart search matches related terms automatically",
    close: "Close", clickWordHint: "Click a word to filter related comments",
    servicesCat: "Services", crowdCat: "Crowd Management", transportCat: "Transportation",
    foodCat: "Food", staffCat: "Staff Behavior", accomCat: "Accommodation", generalCat: "General",
    loginSuccess: "Login successful", pleaseWait: "Please wait...",
  },
  ar: {
    appName: "الحج والعمرة", appSub: "نظام تحليل مشاعر التعليقات",
    welcomeBack: "مرحباً بعودتك", signInSub: "الرجاء تسجيل الدخول إلى حسابك",
    email: "البريد الإلكتروني", password: "كلمة المرور", rememberMe: "تذكرني",
    forgotPassword: "نسيت كلمة المرور؟", signIn: "تسجيل الدخول", or: "أو",
    signInGoogle: "الدخول عبر جوجل", noAccount: "ليس لديك حساب؟",
    signUp: "إنشاء حساب", loginHeadline: "تحليل ملاحظات الحجاج والمعتمرين لتحسين الخدمات وتعزيز تجربة الحج والعمرة.",
    dashboard: "لوحة التحكم", analyzeComment: "تحليل تعليق", comments: "التعليقات",
    analytics: "التحليلات", reports: "التقارير", users: "المستخدمون", profile: "الملف الشخصي",
    settings: "الإعدادات", logout: "تسجيل الخروج",
    totalComments: "إجمالي التعليقات", positive: "إيجابي", negative: "سلبي", neutral: "محايد",
    ofTotal: "من الإجمالي", vsLastMonth: "مقارنة بالشهر الماضي",
    sentimentDistribution: "توزيع المشاعر", sentimentOverTime: "المشاعر عبر الزمن",
    sentimentByCategory: "المشاعر حسب الفئة", recentComments: "أحدث التعليقات",
    topKeywords: "أبرز الكلمات المفتاحية", topCategories: "أبرز الفئات",
    mostPositiveService: "الخدمة الأكثر إيجابية", mostNegativeService: "الخدمة الأكثر سلبية",
    avgSatisfaction: "متوسط الرضا", serviceRanking: "ترتيب الخدمات",
    dailyAnalysis: "يومي", weeklyAnalysis: "أسبوعي", monthlyAnalysis: "شهري",
    viewAll: "عرض الكل", category: "الفئة", date: "التاريخ", sentiment: "الشعور",
    actions: "إجراءات", search: "ابحث في التعليقات...", allSentiments: "كل المشاعر",
    allCategories: "كل الفئات", allDates: "كل التواريخ", exportCsv: "تصدير CSV",
    exportExcel: "تصدير Excel", exportPdf: "تصدير PDF", delete: "حذف", edit: "تعديل",
    view: "عرض", duplicate: "نسخ", showing: "عرض", of: "من", perPage: "لكل صفحة",
    enterComment: "أدخل التعليق", writeComment: "اكتب أو الصق تعليق أحد الحجاج هنا (عربي أو إنجليزي)...",
    analyze: "تحليل", clear: "مسح", paste: "لصق", uploadFile: "رفع ملف نصي",
    voiceInput: "إدخال صوتي", listening: "جاري الاستماع...", analyzing: "جاري التحليل...",
    analysisResult: "نتيجة التحليل", confidenceScore: "درجة الثقة",
    sentimentScores: "درجات المشاعر", reasonOfPrediction: "سبب التصنيف",
    keywordsDetected: "الكلمات المفتاحية المكتشفة", aiRecommendation: "توصية الذكاء الاصطناعي",
    autoReply: "الرد التلقائي المقترح", copyReply: "نسخ الرد", analyzedComment: "التعليق المحلَّل",
    analyzeAnother: "تحليل تعليق آخر", noKeywords: "لم يتم اكتشاف كلمات مشاعر قوية.",
    howItWorks: "كيف يعمل", step1: "أدخل التعليق", step1d: "اكتب أو الصق أي تعليق عن خدمات الحج والعمرة.",
    step2: "تحليل الذكاء الاصطناعي", step2d: "يقوم النظام بتحليل النص باستخدام نماذج الكلمات المفتاحية.",
    step3: "احصل على النتيجة", step3d: "شاهد نتائج المشاعر والتفاصيل فوراً.",
    dailyStats: "إحصائيات يومية", weeklyStats: "إحصائيات أسبوعية", monthlyStats: "إحصائيات شهرية",
    mostFrequentWords: "الكلمات الأكثر تكراراً (سحابة الكلمات)", sentimentTrends: "اتجاهات المشاعر",
    categoryComparison: "مقارنة الفئات", topServices: "أفضل الخدمات", worstServices: "أسوأ الخدمات",
    aiInsights: "رؤى الذكاء الاصطناعي", predictions: "التوقعات", heatMap: "خريطة حرارة الخدمات",
    generateReport: "إنشاء تقرير", reportType: "نوع التقرير", custom: "مخصص", export: "تصدير",
    reportSummary: "الملخص", reportRecommendations: "التوصيات", print: "طباعة / حفظ PDF",
    addUser: "إضافة مستخدم", role: "الصلاحية", admin: "مدير", user: "مستخدم", manager: "مشرف", viewer: "مشاهد",
    guest: "ضيف", continueAsGuest: "المتابعة كضيف",
    adminOnly: "هذه الصفحة متاحة للمدير فقط", adminOnlySub: "سجّل الدخول بحساب المدير للوصول إلى إدارة المستخدمين.",
    protectedAccount: "حساب أساسي محمي — لا يمكن حذفه أو تغيير صلاحيته",
    guestBanner: "أنت تتصفح كضيف — يمكنك مشاهدة التعليقات فقط. أنشئ حسابًا لإضافة تعليق.",
    loginFailed: "بيانات الدخول غير صحيحة",
    name: "الاسم", save: "حفظ التغييرات", theme: "المظهر", light: "فاتح", dark: "داكن",
    language: "اللغة", notifications: "التنبيهات", systemSettings: "إعدادات النظام",
    aiSettings: "إعدادات الذكاء الاصطناعي", exportSettings: "إعدادات التصدير", backupDb: "نسخ احتياطي لقاعدة البيانات",
    restoreDb: "استعادة قاعدة البيانات", security: "الأمان", jwt: "مصادقة JWT",
    rbac: "التحكم بالصلاحيات حسب الدور", pwEnc: "تشفير كلمات المرور", sessionTimeout: "مهلة الجلسة",
    auditLogs: "سجلات المراجعة", enabled: "مفعّل", backendNote: "يتطلب خادم Backend حقيقي",
    warningHighNeg: "تم رصد ارتفاع في التعليقات السلبية هذا الأسبوع.", excellentWeek: "أداء ممتاز هذا الأسبوع — أغلب الملاحظات إيجابية!",
    thankPositive: "اشكر الزائر واستمر في الحفاظ على جودة الخدمة.",
    investigateNegative: "تحقق من المشكلة المُبلّغ عنها وزد الدعم البشري في هذا المجال.",
    collectNeutral: "اجمع المزيد من الملاحظات التفصيلية لفهم تجربة الزائر بشكل أفضل.",
    replyPositive: "شكراً لملاحظتك الكريمة، سعدنا بخدمتك ونتمنى لك حجاً/عمرة مقبولة.",
    replyNegative: "نشكرك على ملاحظتك ونعتذر عن أي إزعاج، سيتم مراجعة المشكلة والعمل على تحسين الخدمة.",
    replyNeutral: "شكراً لمشاركتك تجربتك، يسعدنا معرفة المزيد من التفاصيل منك.",
    smartSearchHint: "البحث الذكي يطابق الكلمات ذات الصلة تلقائياً",
    close: "إغلاق", clickWordHint: "اضغط على كلمة لعرض التعليقات المرتبطة بها",
    servicesCat: "الخدمات", crowdCat: "إدارة الزحام", transportCat: "المواصلات",
    foodCat: "الطعام", staffCat: "سلوك الموظفين", accomCat: "الإقامة", generalCat: "عام",
    loginSuccess: "تم تسجيل الدخول بنجاح", pleaseWait: "الرجاء الانتظار...",
  },
};

/* ============================== SENTIMENT ENGINE ============================== */
const LEXICON = {
  positive: [
    { w: "excellent", ar: "ممتاز" }, { w: "ممتاز", ar: "ممتاز" },
    { w: "excellent", ar: "ممتازة" }, { w: "ممتازة", ar: "ممتازة" },
    { w: "great", ar: "رائع" }, { w: "رائع", ar: "رائع" }, { w: "رائعة", ar: "رائعة" },
    { w: "good", ar: "جيد" }, { w: "جيد", ar: "جيد" }, { w: "جيدة", ar: "جيدة" },
    { w: "fast", ar: "سريع" }, { w: "سريع", ar: "سريع" }, { w: "سريعة", ar: "سريعة" },
    { w: "clean", ar: "نظيف" }, { w: "نظيف", ar: "نظيف" }, { w: "نظيفة", ar: "نظيفة" },
    { w: "helpful", ar: "متعاون" }, { w: "متعاون", ar: "متعاون" }, { w: "متعاونين", ar: "متعاونين" },
    { w: "comfortable", ar: "مريح" }, { w: "مريح", ar: "مريح" }, { w: "مريحة", ar: "مريحة" },
    { w: "organized", ar: "منظم" }, { w: "منظم", ar: "منظم" }, { w: "تنظيم", ar: "تنظيم" },
    { w: "friendly", ar: "ودود" }, { w: "محترم", ar: "محترم" }, { w: "محترمين", ar: "محترمين" },
    { w: "amazing", ar: "رائع جدا" }, { w: "professional", ar: "احترافي" },
    { w: "thank", ar: "شكر" }, { w: "شكراً", ar: "شكراً" }, { w: "جزاكم الله خيرا", ar: "جزاكم الله خيرا" },
    { w: "dقيقة", ar: "دقيقة" }, { w: "تسهيل", ar: "تسهيل" }, { w: "روحانية", ar: "روحانية" },
    { w: "wonderful", ar: "رائعة" },
  ],
  negative: [
    { w: "crowded", ar: "ازدحام" }, { w: "ازدحام", ar: "ازدحام" }, { w: "زحمة", ar: "زحمة" }, { w: "زحام", ar: "زحام" },
    { w: "bad", ar: "سيء" }, { w: "سيء", ar: "سيء" }, { w: "سيئة", ar: "سيئة" },
    { w: "slow", ar: "بطيء" }, { w: "بطيء", ar: "بطيء" }, { w: "بطيئة", ar: "بطيئة" },
    { w: "delay", ar: "تأخير" }, { w: "تأخير", ar: "تأخير" }, { w: "تأخر", ar: "تأخر" },
    { w: "dirty", ar: "متسخ" }, { w: "متسخ", ar: "متسخ" }, { w: "غير نظيف", ar: "غير نظيف" },
    { w: "problem", ar: "مشكلة" }, { w: "مشكلة", ar: "مشكلة" }, { w: "مشاكل", ar: "مشاكل" },
    { w: "poor", ar: "ضعيف" }, { w: "ضعيف", ar: "ضعيف" }, { w: "ضعيفة", ar: "ضعيفة" },
    { w: "rude", ar: "غير محترم" }, { w: "disorganized", ar: "غير منظم" }, { w: "غير منظم", ar: "غير منظم" },
    { w: "complaint", ar: "شكوى" }, { w: "شكوى", ar: "شكوى" }, { w: "يحتاج", ar: "يحتاج" },
    { w: "worst", ar: "أسوأ" }, { w: "hot", ar: "حار جدا" }, { w: "حار", ar: "حار" },
  ],
};
// synonym expansion for smart search
const SYNONYMS = {
  "ازدحام": ["ازدحام", "زحمة", "زحام", "crowded", "crowding"],
  "crowded": ["ازدحام", "زحمة", "زحام", "crowded", "crowding"],
  "تأخير": ["تأخير", "تأخر", "delay", "delayed", "late"],
  "delay": ["تأخير", "تأخر", "delay", "delayed", "late"],
  "نظيف": ["نظيف", "نظيفة", "clean", "cleanliness"],
  "clean": ["نظيف", "نظيفة", "clean", "cleanliness"],
};

function analyzeText(text) {
  const clean = (text || "").trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  const posHits = [];
  const negHits = [];
  LEXICON.positive.forEach(({ w, ar }) => {
    if (lower.includes(w.toLowerCase()) || clean.includes(ar)) {
      const label = /[a-z]/i.test(w) && clean.includes(ar) ? ar : w;
      if (!posHits.includes(label)) posHits.push(label);
    }
  });
  LEXICON.negative.forEach(({ w, ar }) => {
    if (lower.includes(w.toLowerCase()) || clean.includes(ar)) {
      const label = /[a-z]/i.test(w) && clean.includes(ar) ? ar : w;
      if (!negHits.includes(label)) negHits.push(label);
    }
  });
  const posScore = posHits.length;
  const negScore = negHits.length;
  const base = posScore === 0 && negScore === 0 ? 4 : 1;
  let p = posScore * 34 + base * 6;
  let n = negScore * 34 + base * 6;
  let neu = base * 22 + (posScore === 0 && negScore === 0 ? 40 : 4);
  const sum = p + n + neu;
  p = Math.round((p / sum) * 100);
  n = Math.round((n / sum) * 100);
  neu = 100 - p - n;
  let label = "neutral";
  if (p > n && p > neu) label = "positive";
  else if (n > p && n > neu) label = "negative";
  const confidence = Math.max(p, n, neu);
  return {
    label, confidence, scores: { positive: p, negative: n, neutral: neu },
    keywords: [...posHits, ...negHits],
    posHits, negHits,
  };
}

function expandSearchTerm(term) {
  const t = term.trim();
  if (!t) return [];
  for (const key in SYNONYMS) {
    if (SYNONYMS[key].some((s) => s.toLowerCase() === t.toLowerCase())) return SYNONYMS[key];
  }
  return [t];
}

/* ============================== SEED DATA ============================== */
const CATS = ["servicesCat", "crowdCat", "transportCat", "foodCat", "staffCat", "accomCat", "generalCat"];
const seedTexts = [
  ["خدمات ممتازة وتنظيم رائع، أشكر جميع العاملين على تسهيل أداء مناسك الحج", "servicesCat"],
  ["الازدحام كان شديد في بعض الأماكن خصوصاً في الطواف", "crowdCat"],
  ["المواصلات كانت جيدة والمواعيد دقيقة", "transportCat"],
  ["الطعام يحتاج لتحسين و التنوع قليل", "foodCat"],
  ["موظفين الاستقبال متعاونين ومحترمين", "staffCat"],
  ["الغرف نظيفة ومريحة والخدمات رائعة", "accomCat"],
  ["تأخر في إصدار التصاريح سبب لنا مشكلة", "servicesCat"],
  ["تجربة روحانية لا تُنسى، جزاكم الله خيراً", "generalCat"],
  ["The bus service was excellent and very organized", "transportCat"],
  ["Crowded areas near Jamarat made it hard to move", "crowdCat"],
  ["Staff were very helpful and friendly throughout our trip", "staffCat"],
  ["Food quality was poor and options were limited", "foodCat"],
  ["Accommodation was clean and comfortable, great value", "accomCat"],
  ["There was a delay in luggage delivery which was frustrating", "servicesCat"],
  ["Overall a wonderful spiritual experience, thank you", "generalCat"],
  ["الحرم نظيف جداً لكن الزحام في أوقات الذروة سيء", "crowdCat"],
  ["سرعة إجراءات الوصول كانت ممتازة هذا العام", "servicesCat"],
  ["الفندق كان بعيد وسيء الخدمة", "accomCat"],
  ["Transportation between sites was slow and delayed", "transportCat"],
  ["The guides were professional and answered all our questions", "staffCat"],
];
function makeSeedComments() {
  const now = Date.now();
  return seedTexts.map((row, i) => {
    const [text, cat] = row;
    const a = analyzeText(text);
    return {
      id: 1000 + i,
      text,
      category: cat,
      date: new Date(now - i * 8 * 3600 * 1000).toISOString(),
      sentiment: a.label,
      confidence: a.confidence,
      keywords: a.keywords,
    };
  });
}

/* ============================== SMALL UI ATOMS ============================== */
const Card = ({ children, className = "", dark }) => (
  <div className={`rounded-2xl border shadow-sm ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"} ${className}`}>
    {children}
  </div>
);

const SentimentBadge = ({ s, t, size = "sm" }) => {
  const map = {
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-rose-100 text-rose-700",
    neutral: "bg-gray-200 text-gray-600",
  };
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return <span className={`inline-flex items-center rounded-full font-medium ${pad} ${map[s]}`}>{t[s]}</span>;
};

const PILL = "px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500";

/* ============================== LOGIN PAGE ============================== */
const ADMIN_EMAIL = "abdullah1222@gmail.com"; // fixed admin — cannot be deleted or demoted
const ADMIN_PASSWORD = "Ab1231234";

function LoginPage({ t, lang, setLang, dark, setDark, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === ADMIN_EMAIL && pw === ADMIN_PASSWORD) {
        onLogin({ name: "Admin User", email: ADMIN_EMAIL, role: "admin" });
      } else {
        setError(t.loginFailed);
      }
    }, 700);
  };
  const continueAsGuest = () => onLogin({ name: t.guest, email: null, role: "guest", guest: true });
  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${dark ? "bg-slate-950" : "bg-emerald-50"}`}>
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-10">
        <div />
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shadow-sm ${dark ? "bg-slate-800 text-gray-200" : "bg-white text-emerald-900"}`}>
            <Globe size={15} /> {lang === "ar" ? "EN" : "AR"}
          </button>
          <button onClick={() => setDark(!dark)}
            className={`flex items-center justify-center w-9 h-9 rounded-full shadow-sm ${dark ? "bg-slate-800 text-amber-300" : "bg-white text-emerald-900"}`}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
      <div className={`w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl ${dark ? "bg-slate-900" : "bg-white"}`}>
        <div className="relative hidden md:flex flex-col justify-end p-8 text-white min-h-[520px]"
          style={{ background: "linear-gradient(180deg, rgba(3,30,22,.55), rgba(3,20,15,.85)), url(https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1200&auto=format&fit=crop) center/cover" }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="mb-4 text-amber-300">
            <path d="M12 2C9 6 8 8 8 11a4 4 0 008 0c0-3-1-5-4-9z" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 21v-3a8 8 0 0116 0v3" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <h1 className="text-3xl font-bold mb-2">{t.appName}</h1>
          <p className="text-white/70 text-sm mb-1">{t.appSub}</p>
          <div className="h-px w-16 bg-amber-300/70 my-3" />
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">{t.loginHeadline}</p>
        </div>
        <form onSubmit={submit} className="p-8 md:p-10 flex flex-col justify-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? "bg-slate-800" : "bg-emerald-50"}`}>
            <User className={dark ? "text-emerald-300" : "text-emerald-700"} size={24} />
          </div>
          <h2 className={`text-xl font-bold text-center ${dark ? "text-white" : "text-gray-900"}`}>{t.welcomeBack}</h2>
          <p className={`text-sm text-center mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.signInSub}</p>
          {error && <p className="text-rose-600 text-xs text-center mb-3">{error}</p>}
          <label className={`text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>{t.email}</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mb-4 ${PILL} w-full ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`} />
          <label className={`text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>{t.password}</label>
          <input required type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            className={`mb-3 ${PILL} w-full ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`} />
          <div className="flex items-center justify-between mb-5 text-sm">
            <label className={`flex items-center gap-2 ${dark ? "text-gray-300" : "text-gray-600"}`}>
              <input type="checkbox" defaultChecked className="rounded accent-emerald-600" /> {t.rememberMe}
            </label>
            <button type="button" className="text-emerald-600 font-medium">{t.forgotPassword}</button>
          </div>
          <button disabled={loading} type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white rounded-xl py-2.5 font-medium flex items-center justify-center gap-2 transition">
            {loading ? <><RefreshCw size={16} className="animate-spin" />{t.pleaseWait}</> : t.signIn}
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className={`h-px flex-1 ${dark ? "bg-slate-700" : "bg-gray-200"}`} />
            <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>{t.or}</span>
            <div className={`h-px flex-1 ${dark ? "bg-slate-700" : "bg-gray-200"}`} />
          </div>
          <button type="button" onClick={continueAsGuest}
            className={`w-full rounded-xl py-2.5 font-medium border flex items-center justify-center gap-2 ${dark ? "border-slate-700 text-gray-200 hover:bg-slate-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
            <User size={16} /> {t.continueAsGuest}
          </button>
          <p className={`text-center text-sm mt-5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {t.noAccount} <button type="button" className="text-emerald-600 font-medium">{t.signUp}</button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ============================== LAYOUT ============================== */
function Sidebar({ t, page, setPage, dark, lang, mobileOpen, setMobileOpen, isAdmin }) {
  const items = [
    ["dashboard", LayoutDashboard], ["analyzeComment", MessageSquareText], ["comments", MessagesSquare],
    ["analytics", BarChart3], ["reports", FileText], ["users", Users], ["profile", User], ["settings", Settings],
  ].filter(([key]) => key !== "users" || isAdmin); // admin panel is admin-only
  return (
    <div className={`${mobileOpen ? "translate-x-0" : lang === "ar" ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"}
      fixed md:static z-40 top-0 bottom-0 ${lang === "ar" ? "right-0" : "left-0"} w-64 transition-transform duration-300
      flex flex-col justify-between p-4 ${dark ? "bg-slate-950 border-slate-800" : "bg-emerald-950"} text-white`}>
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-amber-300 shrink-0">
            <path d="M12 2C9 6 8 8 8 11a4 4 0 008 0c0-3-1-5-4-9z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 21v-3a8 8 0 0116 0v3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div>
            <div className="font-bold leading-tight">{t.appName}</div>
            <div className="text-[11px] text-emerald-200/70 leading-tight">{t.appSub}</div>
          </div>
        </div>
        <nav className="space-y-1">
          {items.map(([key, Icon]) => (
            <button key={key} onClick={() => { setPage(key); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition
                ${page === key ? "bg-emerald-700 text-white shadow" : "text-emerald-100/80 hover:bg-emerald-900/60"}`}>
              <Icon size={17} /> <span>{t[key]}</span>
            </button>
          ))}
        </nav>
      </div>
      <div>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-100/70 hover:bg-emerald-900/60">
          <LogOut size={17} /> {t.logout}
        </button>
        <div className="relative mt-4 h-24 rounded-xl overflow-hidden opacity-80">
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(3,30,22,0), rgba(0,0,0,.6)), url(https://images.unsplash.com/photo-1564769625392-651b2f2b9c5a?q=80&w=600&auto=format&fit=crop) center/cover" }} />
        </div>
      </div>
    </div>
  );
}

function Topbar({ t, lang, setLang, dark, setDark, title, notifCount, setMobileOpen, dark2 }) {
  return (
    <div className={`sticky top-0 z-20 flex items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-b backdrop-blur
      ${dark ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-gray-100"}`}>
      <div className="flex items-center gap-3">
        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)}>
          <Menu className={dark ? "text-gray-300" : "text-gray-600"} size={20} />
        </button>
        <h1 className={`font-bold text-lg ${dark ? "text-white" : "text-gray-900"}`}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
            ${dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-700"}`}>
          <Globe size={13} /> {lang === "ar" ? "English" : "العربية"}
        </button>
        <button onClick={() => setDark(!dark)}
          className={`w-9 h-9 flex items-center justify-center rounded-full border ${dark ? "border-slate-700 text-amber-300" : "border-gray-200 text-gray-600"}`}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className={`relative w-9 h-9 flex items-center justify-center rounded-full border ${dark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-600"}`}>
          <Bell size={16} />
          {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{notifCount}</span>}
        </button>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${dark ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-800"}`}>A</div>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
const COLORS = { positive: "#059669", negative: "#e11d48", neutral: "#9ca3af" };

function StatCard({ icon: Icon, label, value, sub, subColor, dark, accent }) {
  return (
    <Card dark={dark} className="p-4 flex items-start justify-between">
      <div>
        <div className={`text-xs mb-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>{label}</div>
        <div className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{value}</div>
        {sub && <div className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</div>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent + "22", color: accent }}>
        <Icon size={18} />
      </div>
    </Card>
  );
}

function Dashboard({ t, comments, dark, lang }) {
  const total = comments.length;
  const pos = comments.filter((c) => c.sentiment === "positive").length;
  const neg = comments.filter((c) => c.sentiment === "negative").length;
  const neu = total - pos - neg;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const pieData = [
    { name: t.positive, value: pos, key: "positive" },
    { name: t.negative, value: neg, key: "negative" },
    { name: t.neutral, value: neu, key: "neutral" },
  ];

  const trend = useMemo(() => {
    const days = 7;
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      const dayStr = d.toLocaleDateString(lang === "ar" ? "ar" : "en", { weekday: "short" });
      const dayComments = comments.filter((c) => new Date(c.date).toDateString() === d.toDateString());
      arr.push({
        day: dayStr,
        positive: dayComments.filter((c) => c.sentiment === "positive").length,
        negative: dayComments.filter((c) => c.sentiment === "negative").length,
        neutral: dayComments.filter((c) => c.sentiment === "neutral").length,
      });
    }
    return arr;
  }, [comments, lang]);

  const byCategory = useMemo(() => {
    const map = {};
    CATS.forEach((c) => (map[c] = { total: 0, pos: 0 }));
    comments.forEach((c) => {
      map[c.category].total++;
      if (c.sentiment === "positive") map[c.category].pos++;
    });
    return CATS.map((c) => ({ name: t[c], pct: map[c].total ? Math.round((map[c].pos / map[c].total) * 100) : 0 }));
  }, [comments, t]);

  const keywordFreq = useMemo(() => {
    const freq = {};
    comments.forEach((c) => c.keywords.forEach((k) => (freq[k] = (freq[k] || 0) + 1)));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [comments]);

  const catCount = useMemo(() => {
    const map = {};
    comments.forEach((c) => (map[c.category] = (map[c.category] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [comments]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessagesSquare} label={t.totalComments} value={total} sub={`↑ ${t.vsLastMonth}`} subColor="text-emerald-600" dark={dark} accent="#0369a1" />
        <StatCard icon={ThumbsUp} label={t.positive} value={pos} sub={`${pct(pos)}% ${t.ofTotal}`} subColor="text-emerald-600" dark={dark} accent={COLORS.positive} />
        <StatCard icon={ThumbsDown} label={t.negative} value={neg} sub={`${pct(neg)}% ${t.ofTotal}`} subColor="text-rose-600" dark={dark} accent={COLORS.negative} />
        <StatCard icon={Minus} label={t.neutral} value={neu} sub={`${pct(neu)}% ${t.ofTotal}`} subColor="text-gray-500" dark={dark} accent={COLORS.neutral} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card dark={dark} className="p-4 lg:col-span-1">
          <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.sentimentDistribution}</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {pieData.map((e) => <Cell key={e.key} fill={COLORS[e.key]} />)}
              </Pie>
              <Tooltip /> <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card dark={dark} className="p-4 lg:col-span-2">
          <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.sentimentOverTime}</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#eee"} />
              <XAxis dataKey="day" stroke={dark ? "#94a3b8" : "#666"} fontSize={12} />
              <YAxis stroke={dark ? "#94a3b8" : "#666"} fontSize={12} />
              <Tooltip /> <Legend />
              <Area type="monotone" dataKey="positive" stroke={COLORS.positive} fill={COLORS.positive} fillOpacity={0.25} />
              <Area type="monotone" dataKey="negative" stroke={COLORS.negative} fill={COLORS.negative} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card dark={dark} className="p-4 lg:col-span-2">
          <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.sentimentByCategory}</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#eee"} />
              <XAxis type="number" domain={[0, 100]} stroke={dark ? "#94a3b8" : "#666"} fontSize={11} />
              <YAxis type="category" dataKey="name" width={110} stroke={dark ? "#94a3b8" : "#666"} fontSize={11} />
              <Tooltip />
              <Bar dataKey="pct" fill={COLORS.positive} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card dark={dark} className="p-4">
          <div className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.topCategories}</div>
          <div className="space-y-2.5">
            {catCount.map(([cat, n]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className={`text-xs flex-1 ${dark ? "text-gray-300" : "text-gray-600"}`}>{t[cat]}</div>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-gray-100"}`}>
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(n / comments.length) * 100}%` }} />
                </div>
                <div className={`text-xs w-5 text-right ${dark ? "text-gray-400" : "text-gray-500"}`}>{n}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card dark={dark} className="p-4 lg:col-span-2">
          <div className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.recentComments}</div>
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {comments.slice(0, 6).map((c) => (
              <div key={c.id} className={`flex items-center justify-between gap-3 p-2.5 rounded-xl ${dark ? "bg-slate-800/60" : "bg-gray-50"}`}>
                <div className={`text-xs truncate flex-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>{c.text}</div>
                <SentimentBadge s={c.sentiment} t={t} />
              </div>
            ))}
          </div>
        </Card>
        <Card dark={dark} className="p-4">
          <div className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.topKeywords}</div>
          <div className="flex flex-wrap gap-2">
            {keywordFreq.map(([w, n]) => (
              <span key={w} className={`px-2.5 py-1 rounded-full text-xs ${dark ? "bg-slate-800 text-gray-200" : "bg-emerald-50 text-emerald-800"}`}
                style={{ fontSize: 10 + Math.min(n, 5) * 1.5 }}>{w}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== ANALYZE COMMENT ============================== */
function AnalyzeComment({ t, dark, onSave }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef(null);

  const runAnalyze = () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const r = analyzeText(text);
      setResult(r);
      setLoading(false);
      onSave({ text, ...r });
    }, 600);
  };

  const handlePaste = async () => {
    try { const clip = await navigator.clipboard.readText(); setText((v) => v + clip); }
    catch { /* clipboard unavailable in sandbox */ }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(file);
  };

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser."); return; }
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setText((v) => v + e.results[0][0].transcript);
    rec.start();
  };

  const emoji = result ? (result.label === "positive" ? "😊" : result.label === "negative" ? "😠" : "😐") : null;
  const recoMap = { positive: t.thankPositive, negative: t.investigateNegative, neutral: t.collectNeutral };
  const replyMap = { positive: t.replyPositive, negative: t.replyNegative, neutral: t.replyNeutral };

  return (
    <div className="p-4 md:p-6 grid lg:grid-cols-2 gap-5">
      <Card dark={dark} className="p-5">
        <div className={`font-semibold mb-3 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}>
          <MessageSquareText size={18} className="text-emerald-600" /> {t.enterComment}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={t.writeComment}
          className={`w-full rounded-xl border p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500
            ${dark ? "bg-slate-800 border-slate-700 text-white placeholder:text-gray-500" : "border-gray-200"}`} />
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={runAnalyze} className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Sparkles size={15} /> {loading ? t.analyzing : t.analyze}
          </button>
          <button onClick={() => { setText(""); setResult(null); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border ${dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-600"}`}>
            <X size={14} /> {t.clear}
          </button>
          <button onClick={handlePaste} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border ${dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-600"}`}>
            <ClipboardPaste size={14} /> {t.paste}
          </button>
          <button onClick={() => fileRef.current?.click()} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border ${dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-600"}`}>
            <Upload size={14} /> {t.uploadFile}
          </button>
          <input type="file" accept=".txt" ref={fileRef} className="hidden" onChange={handleFile} />
          <button onClick={handleVoice} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border ${listening ? "border-rose-400 text-rose-500" : dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-600"}`}>
            <Mic size={14} /> {listening ? t.listening : t.voiceInput}
          </button>
        </div>

        <div className={`mt-6 pt-5 border-t ${dark ? "border-slate-800" : "border-gray-100"}`}>
          <div className={`text-sm font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.howItWorks}</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[[MessageSquareText, t.step1, t.step1d], [Sparkles, t.step2, t.step2d], [BarChart3, t.step3, t.step3d]].map(([Icon, title, desc], i) => (
              <div key={i} className={`p-3 rounded-xl ${dark ? "bg-slate-800/60" : "bg-emerald-50/60"}`}>
                <Icon size={18} className="text-emerald-600 mx-auto mb-1.5" />
                <div className={`text-xs font-medium ${dark ? "text-gray-200" : "text-gray-800"}`}>{title}</div>
                <div className={`text-[10px] mt-1 ${dark ? "text-gray-500" : "text-gray-500"}`}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {!result && !loading && (
          <Card dark={dark} className="p-10 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
            <Sparkles size={30} className={dark ? "text-slate-700" : "text-gray-300"} />
            <p className={`mt-3 text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>{t.analysisResult}</p>
          </Card>
        )}
        {loading && (
          <Card dark={dark} className="p-10 flex flex-col items-center justify-center h-full min-h-[300px]">
            <RefreshCw size={26} className="animate-spin text-emerald-600" />
            <p className={`mt-3 text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.analyzing}</p>
          </Card>
        )}
        {result && !loading && (
          <>
            <Card dark={dark} className="p-5">
              <div className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.analysisResult}</div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`flex flex-col items-center justify-center rounded-xl p-4 ${dark ? "bg-slate-800/60" : "bg-emerald-50"}`}>
                  <div className="text-4xl mb-1">{emoji}</div>
                  <SentimentBadge s={result.label} t={t} size="lg" />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <div className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.confidenceScore}</div>
                  <div className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{result.confidence}%</div>
                  {Object.entries(result.scores).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className={`w-14 shrink-0 ${dark ? "text-gray-400" : "text-gray-500"}`}>{t[k]}</span>
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dark ? "bg-slate-800" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full" style={{ width: `${v}%`, background: COLORS[k] }} />
                      </div>
                      <span className={`w-8 text-right ${dark ? "text-gray-400" : "text-gray-500"}`}>{v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card dark={dark} className="p-5">
              <div className={`font-semibold mb-2 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}>
                <Tags size={16} className="text-emerald-600" /> {t.reasonOfPrediction}
              </div>
              {result.keywords.length ? (
                <div className="flex flex-wrap gap-2 mb-1">
                  {(result.label === "negative" ? result.negHits : result.label === "positive" ? result.posHits : result.keywords).map((k) => (
                    <span key={k} className={`px-2.5 py-1 rounded-lg text-xs font-medium
                      ${result.label === "negative" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>{k}</span>
                  ))}
                </div>
              ) : <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.noKeywords}</p>}
            </Card>

            <Card dark={dark} className="p-5">
              <div className={`font-semibold mb-2 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}>
                <Sparkles size={16} className="text-amber-500" /> {t.aiRecommendation}
              </div>
              <p className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{recoMap[result.label]}</p>
            </Card>

            <Card dark={dark} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`font-semibold flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}>
                  <MessagesSquare size={16} className="text-emerald-600" /> {t.autoReply}
                </div>
                <button onClick={() => navigator.clipboard?.writeText(replyMap[result.label])}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${dark ? "border-slate-700 text-gray-300" : "border-gray-200 text-gray-600"}`}>
                  <Copy size={12} /> {t.copyReply}
                </button>
              </div>
              <p className={`text-sm p-3 rounded-xl ${dark ? "bg-slate-800/60 text-gray-300" : "bg-gray-50 text-gray-700"}`}>{replyMap[result.label]}</p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================== COMMENTS PAGE ============================== */
function CommentsPage({ t, dark, comments, setComments, lang, isAdmin }) {
  const [query, setQuery] = useState("");
  const [sentFilter, setSentFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const perPage = 6;

  const filtered = useMemo(() => {
    let list = [...comments];
    if (query.trim()) {
      const terms = expandSearchTerm(query).map((s) => s.toLowerCase());
      list = list.filter((c) => terms.some((tm) => c.text.toLowerCase().includes(tm)) || c.keywords.some((k) => terms.includes(k.toLowerCase())));
    }
    if (sentFilter !== "all") list = list.filter((c) => c.sentiment === sentFilter);
    if (catFilter !== "all") list = list.filter((c) => c.category === catFilter);
    if (sortBy === "date") list.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortBy === "confidence") list.sort((a, b) => b.confidence - a.confidence);
    return list;
  }, [comments, query, sentFilter, catFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const del = (id) => setComments((prev) => prev.filter((c) => c.id !== id));
  const dup = (c) => setComments((prev) => [{ ...c, id: Date.now() }, ...prev]);

  const exportCSV = () => {
    const header = ["id", "text", "category", "sentiment", "confidence", "date"];
    const rows = filtered.map((c) => header.map((h) => `"${String(c[h]).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "comments.csv"; a.click();
  };
  const exportExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(filtered.map((c) => ({
        ID: c.id, Comment: c.text, Category: t[c.category], Sentiment: t[c.sentiment], Confidence: c.confidence + "%", Date: new Date(c.date).toLocaleString(),
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Comments");
      XLSX.writeFile(wb, "comments.xlsx");
    } catch { exportCSV(); }
  };
  const exportPDF = () => window.print();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card dark={dark} className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className={`absolute top-1/2 -translate-y-1/2 ${lang === "ar" ? "right-3" : "left-3"} ${dark ? "text-gray-500" : "text-gray-400"}`} />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={t.search}
              className={`${PILL} w-full ${lang === "ar" ? "pr-9" : "pl-9"} ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`} />
          </div>
          <select value={sentFilter} onChange={(e) => { setSentFilter(e.target.value); setPage(1); }} className={`${PILL} ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`}>
            <option value="all">{t.allSentiments}</option>
            <option value="positive">{t.positive}</option><option value="negative">{t.negative}</option><option value="neutral">{t.neutral}</option>
          </select>
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className={`${PILL} ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`}>
            <option value="all">{t.allCategories}</option>
            {CATS.map((c) => <option key={c} value={c}>{t[c]}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${PILL} ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`}>
            <option value="date">{t.date}</option><option value="confidence">{t.confidenceScore}</option>
          </select>
          <div className="flex gap-1.5 ms-auto">
            <button onClick={exportCSV} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-emerald-700 text-white"><Download size={13} />CSV</button>
            <button onClick={exportExcel} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-emerald-700 text-white"><Download size={13} />Excel</button>
            <button onClick={exportPDF} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-emerald-700 text-white"><Download size={13} />PDF</button>
          </div>
        </div>
        <p className={`text-[11px] mt-2 ${dark ? "text-gray-500" : "text-gray-400"}`}>{t.smartSearchHint}</p>
      </Card>

      <Card dark={dark} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={dark ? "bg-slate-800/60" : "bg-gray-50"}>
              <tr className={dark ? "text-gray-400" : "text-gray-500"}>
                {["ID", t.enterComment, t.sentiment, t.category, t.date, t.actions].map((h) => (
                  <th key={h} className="text-start px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.id} className={`border-t ${dark ? "border-slate-800" : "border-gray-100"}`}>
                  <td className={`px-4 py-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>#{c.id}</td>
                  <td className={`px-4 py-3 max-w-xs truncate ${dark ? "text-gray-200" : "text-gray-800"}`}>{c.text}</td>
                  <td className="px-4 py-3"><SentimentBadge s={c.sentiment} t={t} /></td>
                  <td className={`px-4 py-3 whitespace-nowrap ${dark ? "text-gray-400" : "text-gray-500"}`}>{t[c.category]}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${dark ? "text-gray-400" : "text-gray-500"}`}>{new Date(c.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setViewing(c)} className={`p-1.5 rounded-lg ${dark ? "hover:bg-slate-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Eye size={14} /></button>
                      <button onClick={() => dup(c)} className={`p-1.5 rounded-lg ${dark ? "hover:bg-slate-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Copy size={14} /></button>
                      {isAdmin && <button onClick={() => del(c.id)} className={`p-1.5 rounded-lg ${dark ? "hover:bg-slate-800 text-rose-400" : "hover:bg-gray-100 text-rose-500"}`}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!paged.length && (
                <tr><td colSpan={6} className={`text-center py-8 text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>—</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={`flex items-center justify-between px-4 py-3 border-t text-xs ${dark ? "border-slate-800 text-gray-400" : "border-gray-100 text-gray-500"}`}>
          <span>{t.showing} {paged.length} {t.of} {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </Card>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <Card dark={dark} className="p-5 max-w-md w-full" >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-3">
                <SentimentBadge s={viewing.sentiment} t={t} size="lg" />
                <button onClick={() => setViewing(null)}><X size={18} className={dark ? "text-gray-400" : "text-gray-500"} /></button>
              </div>
              <p className={`text-sm mb-3 ${dark ? "text-gray-200" : "text-gray-800"}`}>{viewing.text}</p>
              <div className={`text-xs grid grid-cols-2 gap-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                <div>{t.category}: {t[viewing.category]}</div>
                <div>{t.confidenceScore}: {viewing.confidence}%</div>
                <div className="col-span-2">{t.date}: {new Date(viewing.date).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ============================== ANALYTICS PAGE ============================== */
function AnalyticsPage({ t, dark, comments }) {
  const [activeWord, setActiveWord] = useState(null);
  const keywordFreq = useMemo(() => {
    const freq = {};
    comments.forEach((c) => c.keywords.forEach((k) => (freq[k] = (freq[k] || 0) + 1)));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 18);
  }, [comments]);

  const heat = useMemo(() => {
    const map = {};
    CATS.forEach((c) => (map[c] = { pos: 0, neg: 0, total: 0 }));
    comments.forEach((c) => { map[c.category].total++; if (c.sentiment === "positive") map[c.category].pos++; if (c.sentiment === "negative") map[c.category].neg++; });
    return CATS.map((c) => ({ cat: c, ...map[c] }));
  }, [comments]);

  const sorted = [...heat].sort((a, b) => (b.pos - b.neg) - (a.pos - a.neg));
  const monthly = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      arr.push({ m: d.toLocaleDateString("en", { month: "short" }), value: Math.max(2, Math.round(comments.length * (0.6 + Math.random() * 0.4) / 6)) });
    }
    return arr;
  }, [comments]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        {[[t.dailyStats, comments.filter((c) => new Date(c.date).toDateString() === new Date().toDateString()).length],
        [t.weeklyStats, comments.filter((c) => Date.now() - new Date(c.date) < 7 * 864e5).length],
        [t.monthlyStats, comments.length]].map(([label, val]) => (
          <Card dark={dark} className="p-4" key={label}>
            <div className={`text-xs mb-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>{label}</div>
            <div className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{val}</div>
          </Card>
        ))}
      </div>

      <Card dark={dark} className="p-4">
        <div className={`font-semibold mb-1 ${dark ? "text-white" : "text-gray-900"}`}>{t.mostFrequentWords}</div>
        <p className={`text-xs mb-3 ${dark ? "text-gray-500" : "text-gray-400"}`}>{t.clickWordHint}</p>
        <div className="flex flex-wrap gap-2">
          {keywordFreq.map(([w, n]) => (
            <button key={w} onClick={() => setActiveWord(w === activeWord ? null : w)}
              style={{ fontSize: 11 + Math.min(n, 6) * 2.2 }}
              className={`px-3 py-1 rounded-full transition ${activeWord === w ? "bg-emerald-700 text-white" : dark ? "bg-slate-800 text-gray-200" : "bg-emerald-50 text-emerald-800"}`}>
              {w}
            </button>
          ))}
        </div>
        {activeWord && (
          <div className={`mt-4 pt-4 border-t space-y-2 ${dark ? "border-slate-800" : "border-gray-100"}`}>
            {comments.filter((c) => c.keywords.includes(activeWord)).slice(0, 5).map((c) => (
              <div key={c.id} className={`text-xs p-2 rounded-lg ${dark ? "bg-slate-800/60 text-gray-300" : "bg-gray-50 text-gray-600"}`}>{c.text}</div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card dark={dark} className="p-4">
          <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.monthlyStats}</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#eee"} />
              <XAxis dataKey="m" fontSize={11} stroke={dark ? "#94a3b8" : "#666"} />
              <YAxis fontSize={11} stroke={dark ? "#94a3b8" : "#666"} />
              <Tooltip /><Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card dark={dark} className="p-4">
          <div className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.heatMap}</div>
          <div className="space-y-2">
            {heat.map((h) => {
              const ratio = h.total ? h.neg / h.total : 0;
              const bg = ratio > 0.4 ? "bg-rose-500" : ratio > 0.15 ? "bg-amber-400" : "bg-emerald-500";
              return (
                <div key={h.cat} className="flex items-center gap-2">
                  <div className={`text-xs w-28 shrink-0 ${dark ? "text-gray-300" : "text-gray-600"}`}>{t[h.cat]}</div>
                  <div className={`flex-1 h-3 rounded-full ${dark ? "bg-slate-800" : "bg-gray-100"}`}><div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.max(8, (h.total / comments.length) * 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card dark={dark} className="p-4">
          <div className={`font-semibold mb-2 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}><TrendingUp size={16} className="text-emerald-600" /> {t.topServices}</div>
          {sorted.slice(0, 3).map((h) => <div key={h.cat} className="flex justify-between text-sm py-1.5"><span className={dark ? "text-gray-300" : "text-gray-700"}>{t[h.cat]}</span><span className="text-emerald-600 font-medium">{h.pos} {t.positive}</span></div>)}
        </Card>
        <Card dark={dark} className="p-4">
          <div className={`font-semibold mb-2 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}><TrendingDown size={16} className="text-rose-500" /> {t.worstServices}</div>
          {sorted.slice(-3).reverse().map((h) => <div key={h.cat} className="flex justify-between text-sm py-1.5"><span className={dark ? "text-gray-300" : "text-gray-700"}>{t[h.cat]}</span><span className="text-rose-500 font-medium">{h.neg} {t.negative}</span></div>)}
        </Card>
      </div>

      <Card dark={dark} className="p-4">
        <div className={`font-semibold mb-2 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}><Sparkles size={16} className="text-amber-500" /> {t.aiInsights}</div>
        <ul className={`text-sm space-y-1.5 list-disc ps-5 ${dark ? "text-gray-300" : "text-gray-700"}`}>
          <li>{t[sorted[0]?.cat]} {t.mostPositiveService.toLowerCase()}.</li>
          <li>{t[sorted[sorted.length - 1]?.cat]} {t.mostNegativeService.toLowerCase()}.</li>
          <li>{t.predictions}: {comments.filter(c=>c.sentiment==='negative').length > comments.length*0.3 ? t.warningHighNeg : t.excellentWeek}</li>
        </ul>
      </Card>
    </div>
  );
}

/* ============================== REPORTS PAGE ============================== */
function ReportsPage({ t, dark, comments }) {
  const [type, setType] = useState("weekly");
  const pos = comments.filter((c) => c.sentiment === "positive").length;
  const neg = comments.filter((c) => c.sentiment === "negative").length;
  const neu = comments.length - pos - neg;
  const topCats = useMemo(() => {
    const map = {};
    comments.forEach((c) => (map[c.category] = (map[c.category] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [comments]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card dark={dark} className="p-4 flex flex-wrap items-center gap-3">
        <span className={`text-sm font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>{t.reportType}:</span>
        {["dailyAnalysis", "weeklyAnalysis", "monthlyAnalysis", "custom"].map((k) => (
          <button key={k} onClick={() => setType(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${type === k ? "bg-emerald-700 text-white" : dark ? "bg-slate-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
            {t[k] || t.custom}
          </button>
        ))}
        <button onClick={() => window.print()} className="ms-auto flex items-center gap-1.5 bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm"><FileText size={14} />{t.print}</button>
      </Card>

      <Card dark={dark} className="p-6" id="report-area">
        <div className="flex items-center gap-2 mb-1">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-emerald-700"><path d="M12 2C9 6 8 8 8 11a4 4 0 008 0c0-3-1-5-4-9z" stroke="currentColor" strokeWidth="1.5" /><path d="M4 21v-3a8 8 0 0116 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>
          <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>{t.appName} — {t.generateReport}</h2>
        </div>
        <p className={`text-xs mb-5 ${dark ? "text-gray-500" : "text-gray-400"}`}>{new Date().toLocaleDateString()} · {t[type] || t.custom}</p>

        <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.reportSummary}</div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className={`p-3 rounded-xl text-center ${dark ? "bg-slate-800/60" : "bg-emerald-50"}`}><div className="text-xl font-bold text-emerald-600">{pos}</div><div className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.positive}</div></div>
          <div className={`p-3 rounded-xl text-center ${dark ? "bg-slate-800/60" : "bg-rose-50"}`}><div className="text-xl font-bold text-rose-600">{neg}</div><div className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.negative}</div></div>
          <div className={`p-3 rounded-xl text-center ${dark ? "bg-slate-800/60" : "bg-gray-100"}`}><div className="text-xl font-bold text-gray-600">{neu}</div><div className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.neutral}</div></div>
        </div>

        <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.topCategories}</div>
        <ul className={`text-sm mb-5 space-y-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
          {topCats.map(([c, n]) => <li key={c}>• {t[c]} — {n} {t.comments}</li>)}
        </ul>

        <div className={`font-semibold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>{t.reportRecommendations}</div>
        <ul className={`text-sm list-disc ps-5 space-y-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
          <li>{t.thankPositive}</li><li>{t.investigateNegative}</li><li>{t.collectNeutral}</li>
        </ul>
      </Card>
    </div>
  );
}

/* ============================== USERS / PROFILE / SETTINGS ============================== */
function UsersPage({ t, dark }) {
  const [users, setUsers] = useState([
    { id: 1, name: "Admin User", email: ADMIN_EMAIL, role: "admin" },
    { id: 2, name: "Sara Guest", email: "sara@hajj.sa", role: "guest" },
    { id: 3, name: "Guest Viewer", email: "guest@hajj.sa", role: "guest" },
  ]);
  const isFixedAdmin = (u) => (u.email || "").toLowerCase() === ADMIN_EMAIL;
  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card dark={dark} className="p-4 flex justify-between items-center">
        <div className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{t.users}</div>
        <button onClick={() => setUsers((u) => [...u, { id: Date.now(), name: "New User", email: "new@hajj.sa", role: "guest" }])}
          className="flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-2 rounded-xl text-sm"><Users size={14} />{t.addUser}</button>
      </Card>
      <Card dark={dark} className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className={dark ? "bg-slate-800/60" : "bg-gray-50"}>
            <tr className={dark ? "text-gray-400" : "text-gray-500"}>{[t.name, t.email, t.role, t.actions].map((h) => <th key={h} className="text-start px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-t ${dark ? "border-slate-800" : "border-gray-100"}`}>
                <td className={`px-4 py-3 ${dark ? "text-gray-200" : "text-gray-800"}`}>{u.name}</td>
                <td className={`px-4 py-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`px-2 py-1 rounded-full text-xs ${dark ? "bg-slate-800 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{t[u.role] || u.role}</span>
                    {isFixedAdmin(u) && <span title={t.protectedAccount} className={`px-2 py-1 rounded-full text-[10px] ${dark ? "bg-amber-900/40 text-amber-300" : "bg-amber-50 text-amber-700"}`}>🔒</span>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className={`p-1.5 rounded-lg ${dark ? "hover:bg-slate-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Edit3 size={14} /></button>
                    {!isFixedAdmin(u) && <button onClick={() => setUsers((list) => list.filter((x) => x.id !== u.id))} className={`p-1.5 rounded-lg ${dark ? "hover:bg-slate-800 text-rose-400" : "hover:bg-gray-100 text-rose-500"}`}><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ProfilePage({ t, dark }) {
  return (
    <div className="p-4 md:p-6 max-w-lg">
      <Card dark={dark} className="p-6 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3 ${dark ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-800"}`}>A</div>
        <input defaultValue="Admin User" className={`${PILL} w-full mb-2 text-center font-semibold ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`} />
        <input defaultValue={ADMIN_EMAIL} className={`${PILL} w-full mb-2 text-center ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`} />
        <input type="password" placeholder={t.password} className={`${PILL} w-full mb-4 text-center ${dark ? "bg-slate-800 border-slate-700 text-white" : "border-gray-200"}`} />
        <button className="w-full bg-emerald-700 text-white rounded-xl py-2.5 font-medium">{t.save}</button>
      </Card>
    </div>
  );
}

function ToggleRow({ label, dark, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
      <button onClick={onChange} className={`w-10 h-5.5 rounded-full relative transition ${checked ? "bg-emerald-600" : dark ? "bg-slate-700" : "bg-gray-300"}`} style={{ height: 22, width: 40 }}>
        <span className="absolute top-0.5 bg-white rounded-full transition" style={{ width: 18, height: 18, left: checked ? 20 : 2 }} />
      </button>
    </div>
  );
}

function SettingsPage({ t, dark, setDark, lang, setLang }) {
  const [toggles, setToggles] = useState({ notif: true, jwt: true, rbac: true, pwEnc: true, audit: false });
  const tog = (k) => setToggles((v) => ({ ...v, [k]: !v[k] }));
  return (
    <div className="p-4 md:p-6 grid lg:grid-cols-2 gap-4">
      <Card dark={dark} className="p-5">
        <div className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>{t.systemSettings}</div>
        <div className="flex items-center justify-between py-2.5">
          <span className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{t.theme}</span>
          <div className="flex gap-2">
            <button onClick={() => setDark(false)} className={`px-3 py-1.5 rounded-lg text-xs ${!dark ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"}`}>{t.light}</button>
            <button onClick={() => setDark(true)} className={`px-3 py-1.5 rounded-lg text-xs ${dark ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"}`}>{t.dark}</button>
          </div>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{t.language}</span>
          <div className="flex gap-2">
            <button onClick={() => setLang("ar")} className={`px-3 py-1.5 rounded-lg text-xs ${lang === "ar" ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"}`}>عربي</button>
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 rounded-lg text-xs ${lang === "en" ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"}`}>English</button>
          </div>
        </div>
        <ToggleRow label={t.notifications} dark={dark} checked={toggles.notif} onChange={() => tog("notif")} />
        <div className={`text-xs mt-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>{t.aiSettings} · {t.exportSettings}</div>
        <div className="flex gap-2 mt-3">
          <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border ${dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-600"}`}><Cloud size={13} />{t.backupDb}</button>
          <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border ${dark ? "border-slate-700 text-gray-200" : "border-gray-200 text-gray-600"}`}><Database size={13} />{t.restoreDb}</button>
        </div>
      </Card>
      <Card dark={dark} className="p-5">
        <div className={`font-semibold mb-3 flex items-center gap-2 ${dark ? "text-white" : "text-gray-900"}`}><ShieldCheck size={16} className="text-emerald-600" /> {t.security}</div>
        <ToggleRow label={`${t.jwt}`} dark={dark} checked={toggles.jwt} onChange={() => tog("jwt")} />
        <ToggleRow label={t.rbac} dark={dark} checked={toggles.rbac} onChange={() => tog("rbac")} />
        <ToggleRow label={t.pwEnc} dark={dark} checked={toggles.pwEnc} onChange={() => tog("pwEnc")} />
        <ToggleRow label={t.auditLogs} dark={dark} checked={toggles.audit} onChange={() => tog("audit")} />
        <div className="flex items-center justify-between py-2.5">
          <span className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{t.sessionTimeout}</span>
          <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>30 min</span>
        </div>
        <p className={`text-[11px] mt-3 flex items-center gap-1.5 ${dark ? "text-amber-400" : "text-amber-600"}`}><KeyRound size={12} /> {t.backendNote}</p>
      </Card>
    </div>
  );
}

/* ============================== APP ROOT ============================== */
export default function HajjUmrahSystem() {
  const [user, setUser] = useState(null);
  const loggedIn = !!user;
  const isAdmin = !!user && user.role === "admin";
  const [lang, setLang] = useState("ar");
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [comments, setComments] = useState(makeSeedComments());
  const [notice, setNotice] = useState(null);
  const t = translations[lang];

  useEffect(() => {
    (async () => {
      try {
        const stored = await window.storage?.get("hajj_comments", false);
        if (stored?.value) {
          const parsed = JSON.parse(stored.value);
          if (Array.isArray(parsed) && parsed.length) setComments(parsed);
        }
      } catch { /* first run - no stored data yet */ }
    })();
  }, []);

  const persist = (list) => {
    setComments(list);
    window.storage?.set("hajj_comments", JSON.stringify(list), false).catch(() => {});
  };

  const addComment = (r) => {
    const cats = CATS;
    const newC = {
      id: Date.now(), text: r.text, category: cats[Math.floor(Math.random() * cats.length)],
      date: new Date().toISOString(), sentiment: r.label, confidence: r.confidence, keywords: r.keywords,
    };
    const list = [newC, ...comments];
    persist(list);
    const negPct = list.filter((c) => c.sentiment === "negative").length / list.length;
    if (negPct > 0.3) setNotice({ type: "warn", text: t.warningHighNeg });
    else if (r.label === "positive") setNotice({ type: "ok", text: t.excellentWeek });
    setTimeout(() => setNotice(null), 4500);
  };

  const negCount = comments.filter((c) => c.sentiment === "negative").length;

  useEffect(() => { document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);

  const fontStack = lang === "ar" ? "'Tajawal', system-ui, sans-serif" : "'Inter', system-ui, sans-serif";

  if (!loggedIn) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ fontFamily: fontStack }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
        <LoginPage t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark} onLogin={setUser} />
      </div>
    );
  }

  const pageComp = {
    dashboard: <Dashboard t={t} comments={comments} dark={dark} lang={lang} />,
    analyzeComment: <AnalyzeComment t={t} dark={dark} onSave={addComment} />,
    comments: <CommentsPage t={t} dark={dark} comments={comments} setComments={persist} lang={lang} isAdmin={isAdmin} />,
    analytics: <AnalyticsPage t={t} dark={dark} comments={comments} />,
    reports: <ReportsPage t={t} dark={dark} comments={comments} />,
    users: isAdmin ? <UsersPage t={t} dark={dark} /> : (
      <div className="p-6 max-w-md mx-auto">
        <Card dark={dark} className="p-8 text-center">
          <div className={`font-bold mb-1 ${dark ? "text-white" : "text-gray-900"}`}>{t.adminOnly}</div>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{t.adminOnlySub}</p>
        </Card>
      </div>
    ),
    profile: <ProfilePage t={t} dark={dark} />,
    settings: <SettingsPage t={t} dark={dark} setDark={setDark} lang={lang} setLang={setLang} />,
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ fontFamily: fontStack }} className={dark ? "dark" : ""}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className={`min-h-screen flex ${dark ? "bg-slate-950" : "bg-gray-50"}`}>
        <Sidebar t={t} page={page} setPage={setPage} dark={dark} lang={lang} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} isAdmin={isAdmin} />
        {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />}
        <div className="flex-1 min-w-0">
          <Topbar t={t} lang={lang} setLang={setLang} dark={dark} setDark={setDark} title={t[page]} notifCount={negCount > 3 ? 1 : 0} setMobileOpen={setMobileOpen} />
          {!isAdmin && (
            <div className={`mx-4 md:mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 ${dark ? "bg-amber-900/25 text-amber-300 border border-amber-800/40" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              <Eye size={13} /> {t.guestBanner}
            </div>
          )}
          {notice && (
            <div className={`mx-4 md:mx-6 mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${notice.type === "warn" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {notice.type === "warn" ? <Bell size={15} /> : <CheckCircle2 size={15} />} {notice.text}
            </div>
          )}
          {pageComp[page]}
        </div>
      </div>
    </div>
  );
}
