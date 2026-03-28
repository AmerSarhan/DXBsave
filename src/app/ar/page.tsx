import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'أفضل عروض وخصومات الإمارات | DXBSave',
  description: 'اكتشف أفضل العروض والخصومات في دبي وأبوظبي والشارقة — فنادق، مطاعم، سبا، أنشطة ترفيهية وأكواد خصم التوصيل. محدث يومياً.',
  alternates: {
    canonical: 'https://dxbsave.com/ar',
    languages: { 'en': 'https://dxbsave.com' },
  },
};

const CATEGORIES_AR = [
  { href: '/deals/hotels',      ar: 'عروض الفنادق والإقامة',        en: 'Hotels & Staycations', icon: '🏨', desc: 'باقات فندقية وتخفيضات يوم السبا وعروض الإقامة في أفضل فنادق الإمارات' },
  { href: '/deals/dining',      ar: 'عروض المطاعم والمقاهي',        en: 'Dining & Drinks',      icon: '🍽️', desc: 'ساعة سعيدة، بوفيه رمضاني، عروض البرنش وخصومات المطاعم في دبي وأبوظبي' },
  { href: '/deals/attractions', ar: 'الأنشطة والمعالم السياحية',    en: 'Attractions',          icon: '🎡', desc: 'دخول مجاني ومخفض لأبرز المعالم السياحية والترفيهية في الإمارات' },
  { href: '/deals/spa',         ar: 'عروض السبا والعناية',          en: 'Spa & Wellness',       icon: '💆', desc: 'جلسات سبا، حمام مغربي، عروض يوم المرأة وباقات الاسترخاء في أفخر المنتجعات' },
  { href: '/deals/delivery',    ar: 'أكواد خصم التوصيل',            en: 'Delivery Codes',       icon: '🛵', desc: 'أكواد خصم ديليفرو وطلبات وكريم فود وأبرز تطبيقات التوصيل في الإمارات' },
  { href: '/deals/shopping',    ar: 'عروض التسوق',                  en: 'Shopping',             icon: '🛍️', desc: 'تخفيضات الموسم وعروض المولات والمتاجر الكبرى في دبي والشارقة' },
];

const EMIRATES_AR = [
  { href: '/deals/dubai',           ar: 'عروض دبي',           desc: 'أفضل الخصومات في دبي' },
  { href: '/deals/abu-dhabi',       ar: 'عروض أبوظبي',        desc: 'عروض وخصومات أبوظبي' },
  { href: '/deals/sharjah',         ar: 'عروض الشارقة',       desc: 'خصومات الشارقة' },
  { href: '/deals/ras-al-khaimah',  ar: 'عروض رأس الخيمة',   desc: 'رأس الخيمة' },
  { href: '/deals/fujairah',        ar: 'عروض الفجيرة',       desc: 'الفجيرة' },
  { href: '/deals/ajman',           ar: 'عروض عجمان',         desc: 'عجمان' },
];

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'أفضل عروض وخصومات الإمارات | DXBSave',
  description: 'اكتشف أفضل العروض والخصومات في دبي وأبوظبي والشارقة.',
  url: 'https://dxbsave.com/ar',
  inLanguage: 'ar',
  isPartOf: { '@type': 'WebSite', name: 'DXBSave', url: 'https://dxbsave.com' },
};

export default function ArabicHomePage() {
  return (
    <main className="min-h-screen bg-stone-50" dir="rtl" lang="ar">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="text-[13px] text-stone-400 hover:text-stone-700 transition-colors">
            English ↗
          </Link>
          <Link href="/" className="text-[20px] font-black text-stone-900 tracking-tight">
            DXBSave
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 mb-3 leading-snug">
            أفضل عروض وخصومات<br />الإمارات
          </h1>
          <p className="text-stone-500 text-[15px] max-w-md mx-auto leading-relaxed">
            نجمع لك أفضل العروض والخصومات في دبي وأبوظبي والشارقة — فنادق، مطاعم، سبا، وأنشطة. محدث يومياً ومجاناً.
          </p>
          <Link
            href="/"
            className="inline-block mt-5 px-6 py-3 bg-stone-900 text-white text-[14px] font-semibold rounded-2xl active:scale-95 transition-transform duration-100"
          >
            تصفح جميع العروض
          </Link>
        </div>

        {/* Categories */}
        <h2 className="text-xl font-bold text-stone-800 mb-4">العروض حسب الفئة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {CATEGORIES_AR.map(cat => (
            <Link
              key={cat.href}
              href={cat.href}
              className="bg-white rounded-2xl p-4 border border-stone-100 hover:border-stone-300 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[22px]">{cat.icon}</span>
                <span className="font-bold text-stone-900 text-[15px] group-hover:text-stone-700">{cat.ar}</span>
              </div>
              <p className="text-[12px] text-stone-400 leading-relaxed pr-9">{cat.desc}</p>
            </Link>
          ))}
        </div>

        {/* Emirates */}
        <h2 className="text-xl font-bold text-stone-800 mb-4">العروض حسب الإمارة</h2>
        <div className="flex flex-wrap gap-2 mb-10">
          {EMIRATES_AR.map(e => (
            <Link
              key={e.href}
              href={e.href}
              className="px-4 py-2 bg-white border border-stone-200 rounded-full text-[13px] font-medium text-stone-700 hover:border-stone-400 transition-colors"
            >
              {e.ar}
            </Link>
          ))}
        </div>

        {/* About */}
        <div className="bg-white border border-stone-100 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-stone-900 mb-2">عن DXBSave</h2>
          <p className="text-[14px] text-stone-500 leading-relaxed">
            DXBSave منصة مجانية تجمع أفضل العروض والخصومات الحصرية في الإمارات العربية المتحدة. نتحقق من كل عرض يدوياً ونحدث القائمة يومياً حتى لا تفوتك أي صفقة. سواء كنت تبحث عن إقامة فندقية مميزة، مطعم بسعر خاص، أو أنشطة عائلية مجانية — DXBSave وجهتك الأولى.
          </p>
        </div>

        {/* FAQ in Arabic */}
        <div className="space-y-4 mb-10">
          <h2 className="text-xl font-bold text-stone-800">أسئلة شائعة</h2>
          {[
            {
              q: 'هل DXBSave مجاني؟',
              a: 'نعم، الموقع مجاني تماماً. لا اشتراك ولا رسوم خفية. نجمع العروض ونتحقق منها لصالحك.',
            },
            {
              q: 'كيف أعرف إذا كان العرض لا يزال سارياً؟',
              a: 'كل عرض في DXBSave يتضمن تاريخ الصلاحية ومعلومات التحقق. إذا انتهى عرض، نحذفه أو نضع عليه تنبيه.',
            },
            {
              q: 'هل العروض خاصة بالمقيمين في الإمارات فقط؟',
              a: 'معظم العروض متاحة للجميع، وعروض المقيمين فقط (مثل عروض المقيمين الذين يحملون الهوية الإماراتية) موضح عليها بشكل واضح.',
            },
            {
              q: 'كيف أقترح عرضاً جديداً؟',
              a: 'يمكنك إرسال اقتراح عبر زر "تواصل معنا" في الموقع. سنتحقق منه ونضيفه إذا كان مناسباً.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white border border-stone-100 rounded-xl p-4">
              <h3 className="font-semibold text-stone-900 text-[14px] mb-1">{q}</h3>
              <p className="text-[13px] text-stone-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <footer className="text-center text-[12px] text-stone-400 pt-6 border-t border-stone-100">
          <Link href="/" className="text-stone-500 hover:text-stone-700">dxbsave.com</Link>
          <span className="mx-2">·</span>
          <span>جميع العروض محدثة يومياً</span>
        </footer>
      </div>
    </main>
  );
}
