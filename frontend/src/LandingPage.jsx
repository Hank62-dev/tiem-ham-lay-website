import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Facebook, Gift, Heart, Instagram, Mail, Menu, Minus, Music2, Plus, RotateCcw, Send, ShoppingBag, Sparkles, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { PageFlip } from 'page-flip';
import { Mascot } from 'page-mascot';
import { PullCord } from 'pullcord';
import 'pullcord/pullcord.css';
import { Animation as ScrollAnimation, Root as ScrollRoot } from '@bsmnt/scrollytelling';
import { createOrder, fetchProducts } from './api';
import './showcase-cutouts.css';

const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/tiemhamlay.handmade/';
const SOCIALS = [
  { label: 'Instagram', href: INSTAGRAM_URL, icon: Instagram },
  { label: 'TikTok handmade', href: 'https://www.tiktok.com/@tiemhamlay.handmade', icon: Music2 },
  { label: 'TikTok social', href: 'https://www.tiktok.com/@tiemhamlay_social', icon: Music2 },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61594678790020', icon: Facebook },
  { label: 'Threads', href: 'https://www.threads.com/@tiemhamlay.handmade', icon: Send },
];
const GROUPS = [
  { prefix: 'bracelet', count: 14, category: 'bracelet', label: 'Vòng tay', price: 30000, copy: 'Một chiếc vòng handmade nhiều hạt xinh, phối theo mood riêng của bạn.' },
  { prefix: 'strap', count: 9, category: 'card-strap', label: 'Dây đeo thẻ', price: 49000, copy: 'Dây đeo thẻ nhiều màu để chiếc thẻ đi học, đi làm cũng có cá tính.' },
  { prefix: 'keychain', count: 6, category: 'keychain', label: 'Móc khóa', price: 35000, copy: 'Charm nhỏ xíu cho chìa khóa, túi tote hoặc chiếc balo thân yêu.' },
];
const FALLBACK_PRODUCTS = GROUPS.flatMap((group) => Array.from({ length: group.count }, (_, index) => ({
  id: `${group.prefix}-${index + 1}`,
  name: `${group.label} #${String(index + 1).padStart(2, '0')}`,
  category: group.category,
  categoryLabel: group.label,
  price: group.price,
  image: `/products/${group.prefix}-${index + 1}.png`,
  description: group.copy,
})));
const money = (value) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
const totalOf = (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const readCart = () => { try { return JSON.parse(localStorage.getItem('hamlay-cart') || '[]'); } catch { return []; } };
const categories = [{ id: 'all', label: 'Tất cả món xinh' }, ...GROUPS.map((group) => ({ id: group.category, label: group.label }))];

function NightStars() {
  const seededRandom = (seed) => { const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return value - Math.floor(value); };
  const stars = Array.from({ length: 240 }, (_, index) => ({
    x: seededRandom(index * 4 + 1) * 100,
    y: seededRandom(index * 4 + 2) * 100,
    size: .8 + seededRandom(index * 4 + 3) * 3.8,
    delay: seededRandom(index * 4 + 4) * -5,
    duration: 2.2 + seededRandom(index * 9 + 5) * 4.5,
  }));
  const falling = Array.from({ length: 58 }, (_, index) => ({
    x: seededRandom(index * 5 + 101) * 100,
    size: .8 + seededRandom(index * 5 + 102) * 2.8,
    delay: seededRandom(index * 5 + 103) * -22,
    duration: 12 + seededRandom(index * 5 + 104) * 16,
  }));
  return <div className="night-stars" aria-hidden="true">{stars.map((star, index) => <i className="night-star" key={`star-${index}`} style={{ '--star-x': `${star.x}%`, '--star-y': `${star.y}%`, '--star-size': `${star.size}px`, '--star-delay': `${star.delay}s`, '--star-duration': `${star.duration}s` }} />)}{falling.map((particle, index) => <i className="night-drift" key={`drift-${index}`} style={{ '--drift-x': `${particle.x}%`, '--drift-size': `${particle.size}px`, '--drift-delay': `${particle.delay}s`, '--drift-duration': `${particle.duration}s` }} />)}</div>;
}

function ThemePullCord({ dark, onPull }) {
  const [hintSeen, setHintSeen] = useState(() => localStorage.getItem('hamlay-pullcord-hint-seen') === 'true');
  const pull = () => { if (!hintSeen) { setHintSeen(true); localStorage.setItem('hamlay-pullcord-hint-seen', 'true'); } onPull(); };
  return <><PullCord className="hamlay-pullcord" pulled={dark} onPull={pull} ariaLabel={dark ? 'Bật giao diện sáng' : 'Bật giao diện tối'} config={{ gravity: 1250, damping: 0.94, iterations: 20, stretchMax: 26 }} />{!hintSeen && <div className="pullcord-hint" aria-hidden="true"><span>pull the<br />cord!</span><b>➜</b></div>}</>;
}

function CharmCursor() {
  const reduce = useReducedMotion();
  const particles = useRef([]);
  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return undefined;
    document.body.classList.add('has-charm-cursor');
    const points = Array.from({ length: 22 }, (_, index) => ({ x: -80 - index * 4, y: -80 - index * 4 }));
    let target = { x: -80, y: -80 }; let frame = 0;
    const move = (event) => { target = { x: event.clientX, y: event.clientY }; };
    const tick = () => {
      points.forEach((point, index) => { const follow = index === 0 ? 0.34 : Math.max(.08, 0.2 - index * 0.005); point.x += (target.x - point.x) * follow; point.y += (target.y - point.y) * follow; const node = particles.current[index]; if (node) { node.style.transform = `translate3d(${point.x}px,${point.y}px,0) scale(${1 - index * .03})`; node.style.opacity = String(Math.max(.16, 1 - index * .038)); } });
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true }); frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); document.body.classList.remove('has-charm-cursor'); };
  }, [reduce]);
  if (reduce) return null;
  const glyphs = ['✦', '✧', '⋆', '·', '✦', '˙', '✧', '⋆', '·', '✦', '✧', '·', '⋆', '✦', '˙', '✧', '·', '✦', '⋆', '✧', '·', '✦'];
  return <div className="cursor-trail" aria-hidden="true">{glyphs.map((glyph, index) => <i key={index} ref={(node) => { particles.current[index] = node; }} className={index === 0 ? 'cursor-core' : 'cursor-dust'}>{glyph}</i>)}</div>;
}

function AmbientMusic() {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(() => localStorage.getItem('hamlay-music-muted') === 'true');
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const audio = audioRef.current; if (!audio) return undefined;
    audio.volume = 1; audio.muted = muted;
    const tryPlay = () => { if (muted) return; audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); };
    tryPlay();
    const resume = () => tryPlay();
    window.addEventListener('pointerdown', resume, { once: true, passive: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => { window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume); };
  }, [muted]);
  const toggle = () => {
    const next = !muted; setMuted(next); localStorage.setItem('hamlay-music-muted', String(next));
    const audio = audioRef.current; if (!audio) return;
    audio.muted = next;
    if (!next) audio.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  };
  return <><audio ref={audioRef} src="/Download.mp3" autoPlay loop preload="auto" aria-hidden="true" /><button type="button" className={`music-toggle ${blocked ? 'is-blocked' : ''}`} onClick={toggle} aria-label={muted ? 'Bật nhạc nền' : 'Tắt nhạc nền'} title={muted ? 'Bật nhạc nền' : 'Tắt nhạc nền'}><span className="music-toggle-spark">✦</span>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}<span className="music-toggle-label">{muted ? 'bật nhạc' : blocked ? 'chạm để nghe' : 'tắt nhạc'}</span></button></>;
}

function usePointerParallax() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current; if (!node) return undefined;
    let activePointerId = null;
    let frame = 0;
    let nextPoint = { x: 0, y: 0 };
    let currentPoint = { x: 0, y: 0 };
    const move = (event) => {
      if (event.pointerType === 'touch' && activePointerId !== null && event.pointerId !== activePointerId) return;
      const rect = node.getBoundingClientRect();
      nextPoint = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2)),
      };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        currentPoint.x += (nextPoint.x - currentPoint.x) * .28;
        currentPoint.y += (nextPoint.y - currentPoint.y) * .28;
        node.style.setProperty('--mx', currentPoint.x.toFixed(3));
        node.style.setProperty('--my', currentPoint.y.toFixed(3));
        frame = 0;
        if (Math.abs(nextPoint.x - currentPoint.x) > .01 || Math.abs(nextPoint.y - currentPoint.y) > .01) move({ clientX: rect.left + (nextPoint.x + 1) * rect.width / 2, clientY: rect.top + (nextPoint.y + 1) * rect.height / 2, pointerType: 'synthetic', pointerId: -1 });
      });
    };
    const down = (event) => {
      if (event.pointerType === 'touch') activePointerId = event.pointerId;
      move(event);
    };
    const end = (event) => {
      if (event.pointerType === 'touch' && event.pointerId === activePointerId) activePointerId = null;
      nextPoint = { x: 0, y: 0 };
      move({ clientX: node.getBoundingClientRect().left + node.getBoundingClientRect().width / 2, clientY: node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2, pointerType: 'synthetic', pointerId: -1 });
    };
    node.addEventListener('pointerdown', down, { passive: true });
    node.addEventListener('pointermove', move, { passive: true });
    node.addEventListener('pointerup', end, { passive: true });
    node.addEventListener('pointercancel', end, { passive: true });
    node.addEventListener('pointerleave', end, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', end);
      node.removeEventListener('pointercancel', end);
      node.removeEventListener('pointerleave', end);
    };
  }, []);
  return ref;
}

function Navigation({ count, onCart }) {
  const [open, setOpen] = useState(false);
  const links = [['Câu chuyện', '#story'], ['Sản phẩm', '#products'], ['Catalogue', '#catalog'], ['Tặng quà', '#gift'], ['Hỏi Lầy', '#faq']];
  return <header className="site-nav"><div className="container nav-inner"><a className="wordmark" href="#top" onClick={() => setOpen(false)}><span className="wordmark-star">✦</span><span>tiệm ham lầy</span></a><nav className={`nav-links ${open ? 'is-open' : ''}`}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<a className="nav-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a></nav><button className="nav-cart" onClick={onCart} aria-label={`Mở giỏ hàng, ${count} sản phẩm`}><ShoppingBag size={18} /><span>{count}</span></button><button className="nav-menu" onClick={() => setOpen((value) => !value)} aria-label="Mở menu">{open ? <X size={21} /> : <Menu size={21} />}</button></div></header>;
}

function LegacyHero({ onExplore }) {
  const reduce = useReducedMotion(); const sceneRef = usePointerParallax();
  return <section className="hero hero-upgraded" id="top"><div className="hero-noise" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-laser laser-one" /><div className="hero-laser laser-two" /><div className="container hero-grid"><motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75 }}><p className="eyebrow">PHỤ KIỆN HANDMADE · LÀM BẰNG NIỀM VUI</p><h1>Nhỏ xíu thôi,<br /><em>thương thiệt to.</em></h1><p className="hero-lede">Một thế giới vòng tay, dây đeo thẻ và móc khóa đang chờ bạn ghé chơi. Chọn một món cho mình, hoặc gói chút dễ thương gửi đến người thương nha.</p><div className="hero-actions"><button className="button button-blue" onClick={onExplore}>Khám phá đồ xinh <ArrowRight size={17} /></button><a className="text-link" href="#story">Tiệm là ai vậy? <ArrowDown size={15} /></a></div><div className="hero-note"><span className="note-dot" /> handmade tại Việt Nam <span>·</span> 29 món đang lấp lánh</div></motion.div><motion.div ref={sceneRef} className="hero-stage hero-stage-upgraded" initial={reduce ? false : { opacity: 0, scale: .84, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: .15, duration: .95, type: 'spring' }}><div className="hero-3d-scene"><div className="hero-glow" /><div className="hero-ring ring-a" /><div className="hero-ring ring-b" /><div className="hero-ring ring-c" /><div className="hero-bead bead-a" /><div className="hero-bead bead-b" /><div className="hero-bead bead-c" /><div className="hero-bead bead-d" /><div className="hero-product-card"><div className="hero-tape" /><span className="hero-label">món quà<br /><b>bé xinh</b></span><img src="/products/bracelet-1.png" alt="Vòng tay handmade" /><span className="hero-caption">một chiếc vòng<br />đang chờ bạn rước về ✦</span></div><div className="hero-float-tag tag-one">handmade ♡</div><div className="hero-float-tag tag-two">+29 món xinh</div><span className="hero-heart">♡</span><span className="hero-star">✦</span><div className="hero-spark-field"><i>✦</i><i>✧</i><i>·</i><i>✦</i><i>·</i></div></div></motion.div></div><div className="hero-scroll"><span>cuộn xuống xem tiệm</span><ArrowDown size={15} /></div></section>;
}

function Hero({ onExplore }) {
  const reduce = useReducedMotion(); const sceneRef = usePointerParallax();
  return <section className="hero hero-upgraded" id="top"><div className="hero-noise" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-laser laser-one" /><div className="hero-laser laser-two" /><div className="container hero-grid"><motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75 }}><p className="eyebrow">PHỤ KIỆN HANDMADE · LÀM BẰNG NIỀM VUI</p><h1>Nhỏ xíu thôi,<br /><em>thương thiệt to.</em></h1><p className="hero-lede">Một thế giới vòng tay, dây đeo thẻ và móc khóa đang chờ bạn ghé chơi. Chọn một món cho mình, hoặc gói chút dễ thương gửi đến người thương nha.</p><div className="hero-actions"><button className="button button-blue" onClick={onExplore}>Khám phá đồ xinh <ArrowRight size={17} /></button><a className="text-link" href="#story">Tiệm là ai vậy? <ArrowDown size={15} /></a></div><div className="hero-note"><span className="note-dot" /> handmade tại Việt Nam <span>·</span> 29 món đang lấp lánh</div></motion.div><motion.div ref={sceneRef} className="hero-stage hero-stage-upgraded" initial={reduce ? false : { opacity: 0, scale: .84, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: .15, duration: .95, type: 'spring' }}><div className="hero-3d-scene"><div className="hero-glow" /><div className="hero-ring ring-a" /><div className="hero-ring ring-b" /><div className="hero-ring ring-c" /><div className="hero-bead bead-a" /><div className="hero-bead bead-b" /><div className="hero-bead bead-c" /><div className="hero-bead bead-d" /><div className="hero-cutout-showcase"><span className="hero-cutout-note">mấy món nhỏ xíu<br /><b>đang bay quanh bạn</b></span><img className="hero-cutout hero-cutout-one" src="/products/cutouts/bracelet-1.png" alt="Vòng tay tách nền" /><img className="hero-cutout hero-cutout-two" src="/products/cutouts/bracelet-4.png" alt="Vòng tay tách nền" /><img className="hero-cutout hero-cutout-three" src="/products/cutouts/bracelet-6.png" alt="Vòng tay tách nền" /></div><div className="hero-float-tag tag-one">handmade ♡</div><div className="hero-float-tag tag-two">+29 món xinh</div><span className="hero-heart">♡</span><span className="hero-star">✦</span><div className="hero-spark-field"><i>✦</i><i>✧</i><i>·</i><i>✦</i><i>·</i></div></div></motion.div></div><div className="hero-scroll"><span>cuộn xuống xem tiệm</span><ArrowDown size={15} /></div></section>;
}

function Story() {
  const reduce = useReducedMotion(); const cards = [['01', 'chọn hạt', 'theo mood của bạn', 'card-pink'], ['02', 'phối charm', 'một chút lầy, rất nhiều yêu', 'card-blue'], ['03', 'gói lời thương', 'gửi đi thật xinh', 'card-yellow']];
  return <section className="section story-section story-section-upgraded" id="story"><ScrollRoot disabled={reduce} start="top 78%" end="bottom 28%" scrub><div className="container story-grid"><div className="story-visual story-visual-upgraded"><div className="story-thread" />{cards.map(([number, title, copy, color], index) => <ScrollAnimation key={number} disabled={reduce} tween={{ start: index * 18, end: 44 + index * 18, fromTo: [{ opacity: 0, y: 70, rotate: index % 2 ? 11 : -11 }, { opacity: 1, y: 0, rotate: color === 'card-blue' ? 7 : color === 'card-yellow' ? -4 : -7 }] }}><motion.div className={`story-card story-card-upgraded ${color}`} whileHover={reduce ? {} : { y: -12, scale: 1.06 }}>{Array.from({ length: 5 }, (_, spark) => <i className="card-spark" key={spark} style={{ '--spark': spark }}>{spark % 2 ? '·' : '✦'}</i>)}<span>{number}</span><strong>{title}</strong><small>{copy}</small><b className="story-card-orbit" /></motion.div></ScrollAnimation>)}</div><div className="story-copy story-copy-depth"><ScrollAnimation disabled={reduce} tween={{ start: 0, end: 16, fromTo: [{ opacity: 0, y: -28, letterSpacing: '0.5em', filter: 'blur(8px)' }, { opacity: 1, y: 0, letterSpacing: '0.17em', filter: 'blur(0px)' }] }}><p className="eyebrow">ĐÔI NÉT VỀ LẦY</p></ScrollAnimation><h2><ScrollAnimation disabled={reduce} tween={{ start: 7, end: 28, fromTo: [{ opacity: 0, x: -90, rotateX: -70 }, { opacity: 1, x: 0, rotateX: 0 }] }}><span className="story-heading-line">Tiệm nhỏ này</span></ScrollAnimation><ScrollAnimation disabled={reduce} tween={{ start: 14, end: 35, fromTo: [{ opacity: 0, x: 90, rotateY: 34 }, { opacity: 1, x: 0, rotateY: 0 }] }}><span className="story-heading-line">làm ra những</span></ScrollAnimation><ScrollAnimation disabled={reduce} tween={{ start: 22, end: 43, fromTo: [{ opacity: 0, y: 60, scale: .76 }, { opacity: 1, y: 0, scale: 1 }] }}><span className="story-heading-line">món đồ có</span></ScrollAnimation><ScrollAnimation disabled={reduce} tween={{ start: 30, end: 52, fromTo: [{ opacity: 0, x: -65, rotateZ: -8 }, { opacity: 1, x: 0, rotateZ: 0 }] }}><span className="story-heading-line">tính <em>cách.</em></span></ScrollAnimation></h2><ScrollAnimation disabled={reduce} tween={{ start: 42, end: 64, fromTo: [{ opacity: 0, y: 55, rotateX: 12, filter: 'blur(5px)' }, { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }] }}><p>Tiệm Ham Lầy được thành lập vào tháng 9 năm 2026 bởi một nhóm 9 bạn sinh viên trong dự án truyền thông số. Tụi mình làm vòng tay, dây đeo thẻ và móc khóa — những món nhỏ xíu nhưng đủ để mang theo một chút vui vẻ mỗi ngày.</p></ScrollAnimation><ScrollAnimation disabled={reduce} tween={{ start: 56, end: 76, fromTo: [{ opacity: 0, x: 80, rotateY: -12 }, { opacity: 1, x: 0, rotateY: 0 }] }}><p>Ngoài vòng xinh, giá hợp lý, tư vấn nhiệt tình, Lầy còn rất lầy lội. Nếu bạn không thích vòng vo, bạn có lẽ đang thích vòng tay nhà Lầy đó.</p></ScrollAnimation><ScrollAnimation disabled={reduce} tween={{ start: 70, end: 96, fromTo: [{ opacity: 0, y: 55, scale: .68, rotateZ: -8 }, { opacity: 1, y: 0, scale: 1, rotateZ: 0 }] }}><div className="quote-card"><span>“</span><p>Đeo một món phụ kiện vui vui, tự nhiên thấy hôm nay cũng đáng yêu hơn.”</p></div></ScrollAnimation></div></div></ScrollRoot></section>;
}

function LegacyProductCard({ product, onAdd, onOpen, onInstagram }) {
  return <motion.article className={`product-card product-card-upgraded product-${product.category}`} layout whileHover={{ y: -10, rotate: product.category === 'keychain' ? -1.5 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}><button className="product-image-wrap product-open-button" onClick={() => onOpen(product)} aria-label={`Xem chi tiết ${product.name}`}><span className="product-sticker">{product.categoryLabel}</span><span className="product-glow" /><span className="product-shine" /><img src={product.image} alt={product.name} loading="lazy" /><span className="product-view-label">xem món này ↗</span><span className="quick-add"><Plus size={18} /></span></button><div className="product-info"><div><button className="product-name-button" onClick={() => onOpen(product)}><h3>{product.name}</h3></button><p>{product.description}</p></div><strong>{money(product.price)}</strong></div><div className="product-actions"><button className="button button-red" onClick={() => onAdd(product)}>Thêm vào giỏ <Plus size={15} /></button><button className="button button-quiet" onClick={() => onInstagram([product])}><Instagram size={15} /> Nhắn tiệm</button></div></motion.article>;
}

function LegacyProductCardWithCutout({ product, onAdd, onOpen, onInstagram }) {
  const cutoutImage = null;

  return <motion.article className={`product-card product-card-upgraded product-${product.category}`} layout whileHover={{ y: -10, rotate: product.category === 'keychain' ? -1.5 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
    <button className="product-image-wrap product-open-button" onClick={() => onOpen(product)} aria-label={`Xem chi tiết ${product.name}`}>
      <span className="product-sticker">{product.categoryLabel}</span>
      <span className="product-glow" />
      <span className="product-shine" />
      <img className="product-base-image" src={product.image} alt={product.name} loading="lazy" />
      {cutoutImage && <span className="product-cutout-stage has-cutout" aria-hidden="true"><img className="product-cutout" src={cutoutImage} alt="" loading="lazy" /></span>}
      <span className="product-view-label">xem món này ↗</span>
      <span className="quick-add"><Plus size={18} /></span>
    </button>
    <div className="product-info"><div><button className="product-name-button" onClick={() => onOpen(product)}><h3>{product.name}</h3></button><p>{product.description}</p></div><strong>{money(product.price)}</strong></div>
    <div className="product-actions"><button className="button button-red" onClick={() => onAdd(product)}>Thêm vào giỏ <Plus size={15} /></button><button className="button button-quiet" onClick={() => onInstagram([product])}><Instagram size={15} /> Nhắn tiệm</button></div>
  </motion.article>;
}

function ProductCard({ product, onAdd, onOpen, onInstagram }) {
  return <motion.article className={`product-card product-card-upgraded product-${product.category}`} layout whileHover={{ y: -10, rotate: product.category === 'keychain' ? -1.5 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
    <button className="product-image-wrap product-open-button" onClick={() => onOpen(product)} aria-label={`Xem chi tiết ${product.name}`}>
      <span className="product-sticker">{product.categoryLabel}</span><span className="product-glow" /><span className="product-shine" />
      <img src={product.image} alt={product.name} loading="lazy" />
      <span className="product-view-label">xem món này ↗</span><span className="quick-add"><Plus size={18} /></span>
    </button>
    <div className="product-info"><div><button className="product-name-button" onClick={() => onOpen(product)}><h3>{product.name}</h3></button><p>{product.description}</p></div><strong>{money(product.price)}</strong></div>
    <div className="product-actions"><button className="button button-red" onClick={() => onAdd(product)}>Thêm vào giỏ <Plus size={15} /></button><button className="button button-quiet" onClick={() => onInstagram([product])}><Instagram size={15} /> Nhắn tiệm</button></div>
  </motion.article>;
}

function ProductDetail({ product, onClose, onAdd, onInstagram }) {
  const [quantity, setQuantity] = useState(1); if (!product) return null;
  return <motion.div className="modal-backdrop product-detail-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.div className="product-detail-modal" initial={{ opacity: 0, y: 24, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }}><button className="detail-close" onClick={onClose} aria-label="Đóng chi tiết"><X /></button><div className="detail-image"><img src={product.image} alt={product.name} /><span>{product.categoryLabel} · hàng handmade</span></div><div className="detail-copy"><p className="eyebrow">MÓN NÀY ĐANG NHÌN BẠN ĐÓ</p><h2>{product.name}</h2><p className="detail-description">{product.description}</p><strong className="detail-price">{money(product.price)}</strong><div className="detail-buy-row"><div className="quantity"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Giảm số lượng"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity((value) => value + 1)} aria-label="Tăng số lượng"><Plus size={14} /></button></div><button className="button button-red" onClick={() => { onAdd(product, quantity); onClose(); }}>Rước về <ShoppingBag size={16} /></button></div><button className="detail-insta" onClick={() => onInstagram([{ ...product, quantity }])}><Instagram size={16} /> Muốn hỏi tiệm về món này</button></div></motion.div></motion.div>;
}

function Products({ products, onAdd, onOpen, onInstagram }) {
  const [filter, setFilter] = useState('all'); const [page, setPage] = useState(1); const pageSize = 9;
  const filtered = filter === 'all' ? products : products.filter((product) => product.category === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const shown = filtered.slice((page - 1) * pageSize, page * pageSize);
  const changeFilter = (value) => { setFilter(value); setPage(1); };
  return <section className="section products-section products-section-upgraded" id="products"><div className="container"><div className="section-heading"><div><p className="eyebrow">MỞ HỘP ĐỒ XINH</p><h2>Chọn món làm tim <em>ting ting.</em></h2></div><p><b>{products.length} món thật</b> đang có mặt trong tiệm. Bấm vào từng món để xem chi tiết, hoặc nhắn Lầy tư vấn trực tiếp nha.</p></div><div className="filter-row" role="tablist">{categories.map((category) => <button key={category.id} className={filter === category.id ? 'is-active' : ''} onClick={() => changeFilter(category.id)}>{category.label}</button>)}</div><motion.div className="product-grid product-grid-upgraded" layout>{shown.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onOpen={onOpen} onInstagram={onInstagram} />)}</motion.div><div className="product-pagination" aria-label="Phân trang sản phẩm"><button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Trang sản phẩm trước"><ChevronLeft size={17} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} className={page === number ? 'is-active' : ''} onClick={() => setPage(number)} aria-current={page === number ? 'page' : undefined}>{String(number).padStart(2, '0')}</button>)}<button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Trang sản phẩm sau"><ChevronRight size={17} /></button><span>{page} / {totalPages}</span></div></div></section>;
}

function LegacyCharmLab({ products, onOpen }) {
  const ref = usePointerParallax(); const featured = products.slice(0, 8); const [mixIndex, setMixIndex] = useState(0); const mix = products[mixIndex % Math.max(products.length, 1)];
  const cutoutImages = ['/products/cutouts/bracelet-1.png', '/products/cutouts/keychain-2.png', '/products/cutouts/bracelet-4.png', '/products/cutouts/keychain-4.png', '/products/cutouts/bracelet-6.png', '/products/cutouts/keychain-5.png', '/products/cutouts/bracelet-2.png', '/products/cutouts/bracelet-7.png'];
  return <section className="section charm-lab" id="charm-lab"><div className="container charm-lab-grid"><div><p className="eyebrow">GÓC THỬ VIBE</p><h2>Chạm vào một<br /><em>hạt lấp lánh.</em></h2><p>Rê chuột quanh các món đang bay lơ lửng để mở chi tiết. Bấm chú cáo ở giữa để lắc và đổi một món ngẫu nhiên — trên điện thoại cũng chơi được nha.</p><span className="charm-lab-tip"><RotateCcw size={15} /> bấm để mix vibe mới</span></div><div className="charm-stage-3d" ref={ref}><div className="charm-orbit orbit-x" /><div className="charm-orbit orbit-y" /><div className="charm-mascot-core" onClick={() => setMixIndex((value) => value + 1)}><Mascot directions="/mascots/fox-riso-directions.webp" reactions="/mascots/fox-riso-reactions.webp" size={180} label="cáo Riso của tiệm" /><span className="charm-mascot-prompt">chạm để<br /><b>đổi vibe</b></span></div><span className="charm-mix-label" aria-live="polite">đang mix · {mix?.name || 'món xinh'}</span><div className="charm-cards-orbit">{featured.map((product, index) => <button key={product.id} className={`flying-charm flying-charm-${index + 1}`} onClick={() => onOpen(product)} aria-label={`Mở ${product.name}`}><img className="charm-cutout-card-image" src={cutoutImages[index] || product.image} alt="" /><i>✦</i></button>)}</div><span className="lab-star star-one">✦</span><span className="lab-star star-two">✧</span></div></div></section>;
}

function LegacyCharmLabCutout({ products, onOpen }) {
  const ref = usePointerParallax(); const [mixIndex, setMixIndex] = useState(0);
  const cutouts = [{ id: 'keychain-2', image: '/products/cutouts/keychain-2.png', label: 'móc khóa hoa' }, { id: 'bracelet-4', image: '/products/cutouts/bracelet-4.png', label: 'vòng tay pastel' }, { id: 'keychain-5', image: '/products/cutouts/keychain-5.png', label: 'móc khóa nhỏ' }];
  const current = cutouts[mixIndex % cutouts.length];
  const openProduct = (id) => { const product = products.find((item) => item.id === id); if (product) onOpen(product); };
  return <section className="section charm-lab" id="charm-lab"><div className="container charm-lab-grid"><div><p className="eyebrow">GÓC THỬ VIBE</p><h2>Chạm vào một<br /><em>hạt lấp lánh.</em></h2><p>Những món nhỏ xíu cũng có thể bay lơ lửng trong một thế giới riêng. Bấm vật thể ở giữa để đổi vibe, hoặc chạm từng món để xem chi tiết nha.</p><span className="charm-lab-tip"><RotateCcw size={15} /> bấm để mix vibe mới</span></div><div className="charm-stage-3d charm-cutout-stage-3d" ref={ref}><div className="charm-orbit orbit-x" /><div className="charm-orbit orbit-y" /><button className="charm-cutout-core" onClick={() => setMixIndex((value) => value + 1)} aria-label="Đổi món đang mix"><span className="charm-core-halo" /><img src={current.image} alt={current.label} /><span>chạm để<br /><b>đổi vibe</b></span></button><span className="charm-mix-label" aria-live="polite">đang mix · {current.label}</span><div className="charm-cutout-orbit"><button className="charm-cutout-item cutout-item-one" onClick={() => openProduct('keychain-2')} aria-label="Mở móc khóa hoa"><img src="/products/cutouts/keychain-2.png" alt="" /><i>✦</i></button><button className="charm-cutout-item cutout-item-two" onClick={() => openProduct('bracelet-4')} aria-label="Mở vòng tay pastel"><img src="/products/cutouts/bracelet-4.png" alt="" /><i>✧</i></button><button className="charm-cutout-item cutout-item-three" onClick={() => openProduct('keychain-5')} aria-label="Mở móc khóa nhỏ"><img src="/products/cutouts/keychain-5.png" alt="" /><i>✦</i></button></div><span className="lab-star star-one">✦</span><span className="lab-star star-two">✧</span></div></div></section>;
}

function CharmLab({ products, onOpen }) {
  const ref = usePointerParallax(); const [mixIndex, setMixIndex] = useState(0); const mix = products[mixIndex % Math.max(products.length, 1)];
  const cutouts = ['/products/cutouts/bracelet-1.png', '/products/cutouts/keychain-2.png', '/products/cutouts/bracelet-4.png', '/products/cutouts/keychain-4.png', '/products/cutouts/bracelet-6.png', '/products/cutouts/keychain-5.png', '/products/cutouts/bracelet-2.png', '/products/cutouts/bracelet-7.png', '/products/cutouts/keychain-3.png'];
  return <section className="section charm-lab" id="charm-lab"><div className="container charm-lab-grid"><div><p className="eyebrow">GÓC THỬ VIBE</p><h2>Chạm vào một<br /><em>hạt lấp lánh.</em></h2><p>Rê chuột quanh các món đang bay lơ lửng để mở chi tiết. Bấm chú cáo ở giữa để lắc và đổi một món ngẫu nhiên — trên điện thoại cũng chơi được nha.</p><span className="charm-lab-tip"><RotateCcw size={15} /> bấm để mix vibe mới</span></div><div className="charm-stage-3d" ref={ref}><div className="charm-orbit orbit-x" /><div className="charm-orbit orbit-y" /><div className="charm-mascot-core" onClick={() => setMixIndex((value) => value + 1)}><Mascot directions="/mascots/fox-riso-directions.webp" reactions="/mascots/fox-riso-reactions.webp" size={180} label="cáo Riso của tiệm" /><span className="charm-mascot-prompt">chạm để<br /><b>đổi vibe</b></span></div><span className="charm-mix-label" aria-live="polite">đang mix · {mix?.name || 'món xinh'}</span><div className="charm-cards-orbit charm-cutout-cards-orbit">{cutouts.map((image, index) => <button key={image} className={`flying-charm flying-charm-${index + 1} ${image.includes('/bracelet-') ? 'cutout-bracelet' : 'cutout-keychain'}`} onClick={() => { const product = products.find((item) => item.image.includes(image.split('/').pop().replace('.png', ''))); if (product) onOpen(product); }} aria-label="Mở món phụ kiện"><img src={image} alt="" /><i>{index % 2 ? '✧' : '✦'}</i></button>)}</div><span className="lab-star star-one">✦</span><span className="lab-star star-two">✧</span></div></div></section>;
}

function CatalogBook({ products }) {
  const bookRef = useRef(null); const flipRef = useRef(null); const [page, setPage] = useState(0); const [failed, setFailed] = useState(false);
  const pages = [
    { className: 'book-cover book-cover-new', content: <><span className="book-brand">tiệm Ham Lầy</span><strong><span>catalogue</span><em>lấp lánh</em></strong><small>lật từng trang<br />· gặp một món thương ✦</small><b>2026 / 01</b></> },
    { content: <><small>trang 01 · bản đồ đồ xinh</small><h3>Nhà Lầy có gì?</h3><div className="book-mini-grid">{products.slice(0, 3).map((product) => <img key={product.id} src={product.image} alt={product.name} />)}</div><strong>29 món nhỏ<br />đang chờ được rước.</strong></> },
    { content: <><small>trang 02 · vòng tay</small><img src={products.find((p) => p.category === 'bracelet')?.image} alt="Vòng tay handmade" /><strong>Đeo một chút<br />lấp lánh.</strong><p>30.000đ · nhiều màu · rất Lầy</p></> },
    { content: <><small>trang 03 · vòng tay</small><img src={products.find((p) => p.id === 'bracelet-7')?.image || products[6]?.image} alt="Vòng tay handmade" /><strong>Hạt nhỏ xíu,<br />mood to thiệt to.</strong><p>Chọn món bạn thấy giống mình nhất.</p></> },
    { content: <><small>trang 04 · dây đeo thẻ</small><img src={products.find((p) => p.category === 'card-strap')?.image} alt="Dây đeo thẻ handmade" /><strong>Chiếc thẻ<br />cũng cần điệu.</strong><p>49.000đ · đi học, đi làm đều vui</p></> },
    { content: <><small>trang 05 · dây đeo thẻ</small><img src={products.find((p) => p.id === 'strap-6')?.image || products[19]?.image} alt="Dây đeo thẻ" /><strong>Mang theo màu<br />của riêng bạn.</strong><p>Đeo lên là nhận ra liền.</p></> },
    { content: <><small>trang 06 · móc khóa</small><img src={products.find((p) => p.category === 'keychain')?.image} alt="Móc khóa handmade" /><strong>Nhỏ mà<br />có võ.</strong><p>35.000đ · móc đâu cũng xinh</p></> },
    { content: <><small>trang 07 · về Ham Lầy</small><h3>Tiệm nhỏ này làm ra món đồ có tính cách.</h3><p>Ham Lầy được thành lập bởi một nhóm 9 bạn sinh viên trong dự án truyền thông số. Tụi mình làm đồ nhỏ xíu, với hy vọng mỗi ngày của bạn có thêm một lý do để mỉm cười.</p><div className="book-stamp">làm bằng tay<br />và một chút lầy ♡</div></> },
    { content: <><small>trang 08 · ghé Lầy</small><h3>Tụi mình ở trên mạng nè</h3><div className="book-contact-list">{SOCIALS.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noreferrer">{social.label} <ArrowRight size={13} /></a>)}<span><Mail size={14} /> tiemnhalayhandmade@gmail.com</span></div><p>Nhắn một câu thôi, tiệm sẽ trả lời thiệt tình.</p></> },
    { content: <><small>trang 09 · lời chúc cuối</small><div className="book-wish">Mong bạn<br /><em>vui thiệt nhiều.</em><span>— tiệm Ham Lầy ✦</span></div><div className="book-spark-cloud">✦ · ✧ · ✦ · ✧</div></> },
    { className: 'book-cover book-back', content: <><span>cảm ơn bạn đã ghé</span><strong>hẹn gặp<br />lại nha ♡</strong><small>tiệm Ham Lầy · món nhỏ, thương to</small></> },
  ];
  useEffect(() => {
    if (!bookRef.current) return undefined;
    let instance; let cancelled = false;
    try {
      instance = new PageFlip(bookRef.current, { width: 420, height: 550, size: 'stretch', minWidth: 230, maxWidth: 560, minHeight: 310, maxHeight: 720, showCover: true, showPageCorners: false, disableFlipByClick: false, mobileScrollSupport: false, drawShadow: true, flippingTime: 1000, maxShadowOpacity: .42, usePortrait: true });
      const nodes = Array.from(bookRef.current.querySelectorAll('.book-page-new')); instance.loadFromHTML(nodes); instance.on('flip', (event) => { if (!cancelled) setPage(event.data); }); flipRef.current = instance;
    } catch (error) { console.error('Catalogue page-flip could not start', error); setFailed(true); }
    return () => { cancelled = true; try { instance?.destroy(); } catch { /* page-flip may already detach its canvas */ } flipRef.current = null; };
  }, []);
  const flip = (direction) => direction > 0 ? flipRef.current?.flipNext() : flipRef.current?.flipPrev();
  return <section className="section catalog-section catalog-section-upgraded" id="catalog"><div className="container catalog-grid"><div className="catalog-copy"><p className="eyebrow">LẬT TRANG XEM TIỆM</p><h2>Một cuốn catalogue <em>có hạt sáng.</em></h2><p>Không chỉ là một quyển sách. Đây là một chuyến dạo qua từng nhóm sản phẩm, câu chuyện, kênh liên hệ và một lời chúc nhỏ tiệm gửi bạn.</p><div className="catalog-controls"><button onClick={() => flip(-1)} aria-label="Trang trước"><ChevronLeft /></button><span>{String(page + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}</span><button onClick={() => flip(1)} aria-label="Trang sau"><ChevronRight /></button></div><small className="catalog-hint">✦ bấm mũi tên hoặc kéo góc trang để lật</small></div><div className={`book-shell book-shell-upgraded ${failed ? 'book-failed' : ''}`}><div className="book book-upgraded" ref={bookRef}>{pages.map((item, index) => <div className={`book-page-new ${item.className || ''}`} key={index}>{item.content}</div>)}</div></div></div></section>;
}

function GiftExperience({ onGift }) {
  const reduce = useReducedMotion(); const target = 'Gửi bạn một món nhỏ xíu, mong bạn vui thiệt nhiều ✦'; const [note, setNote] = useState(''); const [typing, setTyping] = useState(true); const [editing, setEditing] = useState(false); const cardRef = useRef(null);
  useEffect(() => { const node = cardRef.current; if (!node) return undefined; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !note && !editing) { setTyping(true); let index = 0; const timer = setInterval(() => { index += 1; setNote(target.slice(0, index)); if (index >= target.length) { clearInterval(timer); setTyping(false); } }, 48); observer.disconnect(); return () => clearInterval(timer); } }, { threshold: .45 }); observer.observe(node); return () => observer.disconnect(); }, [target, note, editing]);
  return <section className="section gift-section gift-section-upgraded" id="gift"><div className="container gift-grid"><div className="gift-copy"><p className="eyebrow">MỘT MÓN QUÀ CÓ LỜI</p><h2>Quà nhỏ xíu,<br /><em>lời thương to thiệt to.</em></h2><p>Bật chế độ tặng quà khi checkout, điền tên người nhận và lời chúc. Tụi mình sẽ lưu lại cùng đơn để shop không bỏ quên phần dễ thương nhất.</p><button className="button button-blue" onClick={onGift}><Gift size={17} /> Tặng ai đó một món</button></div><div className="gift-card-wrap" ref={cardRef}><div className="gift-ribbon ribbon-one" /><div className="gift-ribbon ribbon-two" /><motion.div className="gift-card gift-card-upgraded" initial={reduce ? false : { opacity: 0, rotate: -12, y: 35 }} whileInView={{ opacity: 1, rotate: -4, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 100 }}><div className="gift-card-top">to: người thương của tui <Heart size={16} fill="currentColor" /></div><textarea value={note} maxLength={140} onFocus={() => { setEditing(true); setTyping(false); }} onChange={(event) => setNote(event.target.value)} aria-label="Lời chúc có thể chỉnh sửa" /><span className={`gift-type-caret ${typing ? 'is-typing' : ''}`} aria-hidden="true">✦</span><div className="gift-edit-hint"><span>{typing ? 'đang viết lời thương...' : '✎ bấm vào dòng chữ để sửa lời chúc'}</span><span>{note.length}/140</span></div><div className="gift-card-footer"><span>with a little sparkle</span><span>tiệm ham lầy ✦</span></div></motion.div><span className="gift-spark spark-one">✦</span><span className="gift-spark spark-two">✧</span><span className="gift-spark spark-three">·</span><span className="gift-spark spark-four">✦</span></div></div></section>;
}

function HowToOrder() {
  const reduce = useReducedMotion(); const steps = [['01', 'Chọn món', 'Lượn một vòng, thấy món nào tim rung thì cho vào giỏ.', '✦'], ['02', 'Điền thông tin', 'Cho tiệm biết bạn là ai và muốn gửi món đến đâu.', '♡'], ['03', 'Gửi đơn', 'Tụi mình nhận đơn, kiểm tra rồi nhắn lại nếu cần.', '↗'], ['04', 'Chuyển khoản', 'Làm theo thông tin thanh toán; gửi đơn chưa có nghĩa là đã xác nhận thanh toán nha.', '✧']];
  return <section className="section how-section how-section-upgraded" id="how"><div className="container"><div className="section-heading"><div><p className="eyebrow">ĐẶT HÀNG DỄ ƠI LÀ DỄ</p><h2>Đi cùng Lầy qua <em>4 nhịp.</em></h2></div><p>Có gì chưa rõ cứ nhắn tiệm. Tận tâm là nghề tay trái, làm đồ xinh mới là nghề tay phải.</p></div><div className="steps-grid steps-grid-upgraded">{steps.map(([number, title, copy, icon], index) => <motion.article className={`step step-upgraded step-${index + 1}`} key={number} initial={reduce ? false : { opacity: 0, y: 35, rotate: index % 2 ? 3 : -3 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * .1, type: 'spring' }} whileHover={reduce ? {} : { y: -12, rotate: index % 2 ? -2 : 2 }}><span className="step-number">{number}</span><b className="step-icon">{icon}</b><span className="step-spark-line" /><h3>{title}</h3><p>{copy}</p></motion.article>)}</div></div></section>;
}

function GalleryContact() {
  return <section className="section gallery-contact"><div className="container"><div className="section-heading"><div><p className="eyebrow">GHÉ CHƠI VỚI TIỆM</p><h2>Nhìn thấy Lầy<br /><em>ở nhiều nơi.</em></h2></div><p>Ảnh sản phẩm thật, kênh liên hệ thật. Tụi mình ở đây để nghe bạn kể gu của mình.</p></div><div className="gallery-grid">{[1, 2, 3, 4].map((index) => <div className={`gallery-tile gallery-tile-${index}`} key={index}><img src={`/products/combo-${index}.png`} alt={`Sản phẩm Ham Lầy ${index}`} loading="lazy" /><span>combo 20·10 ✦</span></div>)}</div><div className="social-wall">{SOCIALS.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={17} /> {label} <ArrowUpRightFallback /></a>)}</div></div></section>;
}
function ArrowUpRightFallback() { return <span aria-hidden="true">↗</span>; }

function FAQ() {
  const items = [['Gửi đơn xong là thanh toán luôn hả?', 'Chưa đâu nha. Gửi đơn chỉ là bước để tiệm nhận thông tin. Tụi mình sẽ xử lý đơn và bạn chuyển khoản theo hướng dẫn; shop cần đối soát thủ công trước khi xác nhận đã thanh toán.'], ['Tiệm chuẩn bị hàng trong bao lâu?', 'Thời gian chuẩn bị tùy tình trạng món và sẽ được shop xác nhận lại khi nhận đơn. Nếu bạn cần gấp, ghi chú giúp tiệm để tụi mình kiểm tra trước nha.'], ['Mình muốn tặng quà thì làm sao?', 'Bật “Tui muốn tặng món này” trong form, điền tên người nhận và lời chúc. Các thông tin này sẽ được lưu cùng đơn để tiệm gói ghém đúng tinh thần.'], ['Mình muốn hỏi qua Instagram?', 'Bấm “Nhắn tiệm” ở sản phẩm hoặc nút Instagram. Website sẽ copy sẵn nội dung gợi ý và mở Instagram; bạn vẫn là người bấm gửi tin nhắn nhé.']]; const [open, setOpen] = useState(0);
  return <section className="section faq-section" id="faq"><div className="container faq-grid"><div><p className="eyebrow">HỎI NHỎ ĐÁP TO</p><h2>Chưa rõ gì cứ<br /><em>hỏi Lầy.</em></h2><p className="faq-aside">Không có câu hỏi nào ngốc nghếch khi bạn đang chuẩn bị tặng ai đó một món quà.</p></div><div className="faq-list">{items.map(([question, answer], index) => <div className={`faq-item ${open === index ? 'is-open' : ''}`} key={question}><button onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><span>{open === index ? '−' : '+'}</span></button><AnimatePresence initial={false}>{open === index && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>;
}

function CartDrawer({ items, setItems, onClose, onCheckout, onInstagram }) {
  const update = (id, delta) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));
  return <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.aside className="cart-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}><div className="drawer-head"><div><p className="eyebrow">TÚI ĐỒ XINH</p><h2>Giỏ hàng</h2></div><button onClick={onClose} aria-label="Đóng giỏ hàng"><X /></button></div>{items.length === 0 ? <div className="empty-cart"><div>♡</div><p>Giỏ đang trống trơn.<br />Thêm một món để tiệm gói niềm vui nha.</p><a href="#products" className="button button-blue" onClick={onClose}>Xem đồ xinh</a></div> : <><div className="cart-items">{items.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{money(item.price)}</small><div className="quantity"><button onClick={() => update(item.id, -1)} aria-label="Giảm"><Minus size={12} /></button><span>{item.quantity}</span><button onClick={() => update(item.id, 1)} aria-label="Tăng"><Plus size={12} /></button></div></div><div className="cart-item-side"><b>{money(item.price * item.quantity)}</b><button className="cart-remove" onClick={() => remove(item.id)} aria-label={`Xóa ${item.name}`} title="Xóa sản phẩm"><Trash2 size={16} /></button></div></div>)}</div><div className="drawer-summary"><span>Tạm tính</span><strong>{money(totalOf(items))}</strong></div><button className="button button-red button-wide" onClick={onCheckout}>Điền form đặt hàng <ArrowRight size={16} /></button><button className="drawer-instagram" onClick={() => onInstagram(items)}><Instagram size={16} /> Hỏi tiệm qua Instagram</button><p className="drawer-note">Bạn có thể xóa món bất kỳ bằng nút thùng rác nha.</p></>}</motion.aside></motion.div>;
}

function compressPaymentProof(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được ảnh chuyển khoản. Bạn thử chọn ảnh khác nha.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Ảnh không hợp lệ. Bạn chọn ảnh chụp giao dịch rõ hơn nha.'));
      image.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', .78);
        if (data.length > 2_400_000) return reject(new Error('Ảnh vẫn hơi nặng. Bạn chọn ảnh nhỏ hơn 8MB hoặc chụp lại gọn hơn nha.'));
        resolve({ data, fileName: file.name, mimeType: 'image/jpeg' });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function OrderModal({ items, onClose, onSuccess }) {
  const total = totalOf(items);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', birthYear: '', gender: 'prefer-not-to-say', address: '', province: '', district: '', note: '', gift: false, recipientName: '', wish: '' });
  const [proof, setProof] = useState(null);
  const [proofName, setProofName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const validateForm = () => {
    const currentYear = new Date().getFullYear();
    if (form.fullName.trim().length < 2 || !form.phone.trim() || !form.birthYear || Number(form.birthYear) < 1900 || Number(form.birthYear) > currentYear || !form.gender || form.address.trim().length < 5) {
      setError('Bạn điền giúp tên, số điện thoại, năm sinh, giới tính và địa chỉ nhận hàng nha.');
      return false;
    }
    if (form.gift && !form.wish.trim()) {
      setError('Món quà có lời thì để lại một lời chúc nha.');
      return false;
    }
    return true;
  };
  const nextToPayment = (event) => {
    event.preventDefault();
    setError('');
    if (validateForm()) setStep(2);
  };
  const chooseProof = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Bạn chọn giúp tiệm một file ảnh nha.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Ảnh tối đa 8MB thôi nha.');
      return;
    }
    try {
      const compressed = await compressPaymentProof(file);
      setProof(compressed);
      setProofName(file.name);
    } catch (requestError) {
      setProof(null);
      setProofName('');
      setError(requestError.message);
    }
  };
  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    if (!proof) {
      setError('Bạn upload ảnh chuyển khoản trước rồi hãy xác nhận đơn nha.');
      return;
    }
    setLoading(true);
    try {
      const result = await createOrder({
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        customer: { fullName: form.fullName.trim(), phone: form.phone.trim(), email: form.email.trim(), birthYear: Number(form.birthYear), gender: form.gender, address: form.address.trim(), province: form.province.trim(), district: form.district.trim() },
        note: form.note.trim(),
        gift: { enabled: form.gift, ...(form.gift ? { recipientName: form.recipientName.trim(), wish: form.wish.trim() } : {}) },
        paymentProof: proof,
      }, crypto.randomUUID());
      onSuccess(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="order-modal checkout-modal" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="modal-head"><div><p className="eyebrow">{step === 1 ? 'BƯỚC 1 · THÔNG TIN' : 'BƯỚC 2 · XÁC NHẬN CHUYỂN KHOẢN'}</p><h2>{step === 1 ? 'Gửi đơn cho tiệm' : 'Chuyển khoản rồi gửi ảnh nha'}</h2></div><button onClick={onClose} aria-label="Đóng form"><X /></button></div><div className="checkout-progress"><span className={step === 1 ? 'is-active' : 'is-done'}>01 Thông tin</span><span className={step === 2 ? 'is-active' : ''}>02 Thanh toán</span></div>{step === 1 ? <form onSubmit={nextToPayment}><div className="order-summary-mini">{items.map((item) => <span key={item.id}>{item.name} × {item.quantity}</span>)}<strong>{money(total)}</strong></div><div className="form-grid"><label>Họ và tên *<input value={form.fullName} onChange={(event) => set('fullName', event.target.value)} placeholder="Tên bạn để tiệm gọi cho thân mật" required /></label><label>Số điện thoại *<input value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="09xx xxx xxx" inputMode="tel" required /></label><label>Email (nếu muốn)<input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="Để tiệm liên hệ khi cần" /></label><label>Tỉnh / thành<input value={form.province} onChange={(event) => set('province', event.target.value)} placeholder="Ví dụ: TP. Hồ Chí Minh" /></label><label>Quận / huyện<input value={form.district} onChange={(event) => set('district', event.target.value)} placeholder="Bạn đang ở đâu nè?" /></label><label>Năm sinh *<input type="number" min="1900" max={new Date().getFullYear()} value={form.birthYear} onChange={(event) => set('birthYear', event.target.value)} placeholder="Ví dụ: 2000" required /></label></div><label>Địa chỉ nhận hàng *<input value={form.address} onChange={(event) => set('address', event.target.value)} placeholder="Số nhà, tên đường..." required /></label><label>Giới tính *<select value={form.gender} onChange={(event) => set('gender', event.target.value)} required><option value="prefer-not-to-say">Không muốn cung cấp</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select></label><label>Ghi chú đơn hàng<textarea value={form.note} onChange={(event) => set('note', event.target.value)} placeholder="Ví dụ: gọi trước khi giao giúp mình nha" maxLength={1000} /></label><label className="gift-toggle"><input type="checkbox" checked={form.gift} onChange={(event) => set('gift', event.target.checked)} /><span><Gift size={18} /> Tui muốn tặng món này cho bạn bè / người thân</span></label>{form.gift && <div className="gift-fields"><label>Tên người nhận<input value={form.recipientName} onChange={(event) => set('recipientName', event.target.value)} placeholder="Gửi đến ai đó thật đáng yêu" /></label><label>Lời chúc *<textarea value={form.wish} onChange={(event) => set('wish', event.target.value)} placeholder="Món quà nhỏ xíu, lời thương to thiệt to..." maxLength={500} required /></label><div className="wish-preview"><small>thiệp xem trước</small><p>{form.wish || 'Lời chúc của bạn sẽ nằm ở đây ✦'}</p></div></div>}{error && <p className="form-error">{error}</p>}<div className="payment-hint"><strong>Bước sau là chuyển khoản</strong><span>Tiệm sẽ hiện QR, số tiền chính xác và chỗ upload ảnh giao dịch ngay sau đây.</span></div><button className="button button-red button-wide">Tiếp tục đến thanh toán <ArrowRight size={17} /></button></form> : <form onSubmit={submitOrder}><div className="payment-checkout-card"><div className="payment-checkout-copy"><p className="eyebrow">SỐ TIỀN CẦN CHUYỂN</p><strong>{money(total)}</strong><p>Chuyển đúng số tiền này giúp tiệm đối soát nhanh hơn nha.</p><div className="payment-account"><span>NGUYEN LE THU HA</span><b>0399799892</b><small>Nội dung gợi ý: HAMLAY {form.phone.slice(-4)}</small><button type="button" onClick={() => navigator.clipboard?.writeText('0399799892')}>Copy số tài khoản <Copy size={14} /></button></div></div><img className="payment-qr" src="/qr.jpg" alt="QR chuyển khoản của Tiệm Ham Lầy" /></div><div className="payment-proof-upload"><div><p className="eyebrow">GỬI ẢNH XÁC NHẬN</p><h3>Chuyển khoản xong, upload ảnh giao dịch nha ✦</h3><p>Ảnh chỉ dùng để shop đối chiếu thủ công. Bấm xác nhận đơn không có nghĩa hệ thống tự đánh dấu đã thanh toán.</p></div><label className="payment-proof-drop"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseProof} required /><span>{proof ? 'Đổi ảnh chuyển khoản' : 'Chọn ảnh chuyển khoản'}</span><small>{proof ? proofName : 'PNG, JPG hoặc WEBP · tối đa 8MB'}</small></label>{proof && <img className="payment-proof-preview" src={proof.data} alt="Ảnh chuyển khoản vừa chọn" />}</div>{error && <p className="form-error">{error}</p>}<div className="checkout-actions"><button type="button" className="button button-quiet" onClick={() => { setError(''); setStep(1); }}>← Sửa thông tin</button><button className="button button-red" disabled={loading}>{loading ? 'Đang gửi đơn...' : 'Xác nhận đã chuyển khoản · Gửi đơn'}<Check size={17} /></button></div></form>}</motion.div></motion.div>;
}

function SuccessModal({ result, onClose }) {
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}><motion.div className="success-modal" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}><div className="success-icon"><Check /></div><p className="eyebrow">ĐÃ NHẬN ĐƠN VÀ ẢNH RỒI NÈ</p><h2>Mã đơn <em>{result.orderCode}</em></h2><p>Tiệm đã nhận thông tin và ảnh chuyển khoản. Tụi mình sẽ đối soát giao dịch thủ công rồi liên hệ nếu cần nha.</p><div className="success-received"><span>Số tiền trong đơn</span><strong>{money(result.total)}</strong><small>Trạng thái thanh toán hiện tại: chờ đối soát</small></div><button className="button button-blue button-wide" onClick={onClose}>Đóng và tiếp tục ngắm đồ <ArrowRight size={17} /></button></motion.div></motion.div>;
}

function Footer() { return <footer className="site-footer"><div className="container footer-grid"><div><a href="#top" className="wordmark"><span className="wordmark-star">✦</span><span>tiệm ham lầy</span></a><p>Món quà nhỏ xíu,<br />lời thương to thiệt to.</p></div><div><small>ghé chơi với tiệm</small><a href="#products">Sản phẩm</a><a href="#catalog">Catalogue</a><a href="#gift">Tặng quà</a><a href="#faq">Hỏi đáp</a></div><div><small>tìm thấy tụi mình</small>{SOCIALS.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={15} /> {label}</a>)}<span><Mail size={15} /> tiemnhalayhandmade@gmail.com</span></div></div><div className="container footer-bottom"><span>© 2026 Tiệm Ham Lầy</span><span>làm bằng tay và một chút lầy ♡</span></div></footer>; }

function InstagramToast({ items, onClose }) {
  const message = items.map((item) => `Tui muốn đặt ${item.name} × ${item.quantity || 1}, tư vấn giúp mình nhé`).join('\n');
  useEffect(() => { navigator.clipboard?.writeText(message).catch(() => {}); const timer = setTimeout(onClose, 6000); return () => clearTimeout(timer); }, [message, onClose]);
  return <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}><Check size={18} /><span>Đã copy lời nhắn rồi, mở Instagram gửi tiệm nha.</span><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Mở Instagram <ArrowRight size={14} /></a><button onClick={onClose}><X size={15} /></button></motion.div>;
}

export default function LandingPage() {
  const [dark, setDark] = useState(() => localStorage.getItem('hamlay-theme') === 'dark'); const [products, setProducts] = useState(FALLBACK_PRODUCTS); const [cart, setCart] = useState(readCart); const [drawer, setDrawer] = useState(false); const [detail, setDetail] = useState(null); const [orderOpen, setOrderOpen] = useState(false); const [success, setSuccess] = useState(null); const [insta, setInsta] = useState(null);
  useEffect(() => { fetchProducts().then((data) => { if (Array.isArray(data) && data.length) setProducts(data); }).catch(() => {}); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('hamlay-theme', dark ? 'dark' : 'light'); return () => { delete document.documentElement.dataset.theme; }; }, [dark]);
  useEffect(() => { localStorage.setItem('hamlay-cart', JSON.stringify(cart)); }, [cart]);
  const add = (product, quantity = 1) => { setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { ...product, quantity }]; }); setDrawer(true); };
  const openInstagram = (items) => { const message = items.map((item) => `Tui muốn đặt ${item.name} × ${item.quantity || 1}, tư vấn giúp mình nhé`).join('\n'); navigator.clipboard?.writeText(message).catch(() => {}); window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer'); setInsta(items); };
  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const jumpToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  return <div className={`site-shell ${dark ? 'theme-dark' : ''}`}><NightStars /><ThemePullCord dark={dark} onPull={() => setDark((value) => !value)} /><CharmCursor /><AmbientMusic /><Navigation count={count} onCart={() => setDrawer(true)} /><main><Hero onExplore={jumpToProducts} /><Story /><CatalogBook products={products} /><Products products={products} onAdd={add} onOpen={setDetail} onInstagram={openInstagram} /><LegacyCharmLab products={products} onOpen={setDetail} /><GiftExperience onGift={jumpToProducts} /><HowToOrder /><section className="payment-band"><div className="container payment-band-inner"><Sparkles size={24} /><span><strong>Chuyển khoản rõ ràng, kiểm tra thủ công.</strong> Gửi đơn không tự động đánh dấu đã thanh toán.</span><a href="#how">Xem quy trình <ArrowRight size={15} /></a></div></section><GalleryContact /><FAQ /></main><Footer /><AnimatePresence>{drawer && <CartDrawer items={cart} setItems={setCart} onCheckout={() => { setDrawer(false); setOrderOpen(true); }} onClose={() => setDrawer(false)} onInstagram={openInstagram} />}{detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onAdd={add} onInstagram={openInstagram} />}{orderOpen && <OrderModal items={cart} onClose={() => setOrderOpen(false)} onSuccess={(result) => { setCart([]); setOrderOpen(false); setSuccess(result); }} />}{success && <SuccessModal result={success} onClose={() => setSuccess(null)} />}{insta && <InstagramToast items={insta} onClose={() => setInsta(null)} />}</AnimatePresence></div>;
}
