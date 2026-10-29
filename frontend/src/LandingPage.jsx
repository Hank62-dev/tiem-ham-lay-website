import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Copy, Eye, Facebook, Gift, Globe, Heart, Instagram, Mail, Menu, Minus, Music2, Plus, RotateCcw, Send, ShieldCheck, ShoppingBag, Sparkles, Target, Trash2, Truck, Volume2, VolumeX, Wallet, X } from 'lucide-react';
import { createOrder, fetchProducts } from './api';

const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/tiemhamlay.handmade/';
const SOCIALS = [
  { label: 'Instagram', href: INSTAGRAM_URL, icon: Instagram },
  { label: 'TikTok handmade', href: 'https://www.tiktok.com/@tiemhamlay.handmade', icon: Music2 },
  { label: 'TikTok social', href: 'https://www.tiktok.com/@tiemhamlay_social', icon: Music2 },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61594678790020', icon: Facebook },
  { label: 'Threads', href: 'https://www.threads.com/@tiemhamlay.handmade', icon: Send },
];
// Names and taglines are the ones printed on the shop's own product photos; keep them in sync with backend/src/config/products.ts.
const GROUPS = [
  { prefix: 'bracelet', category: 'bracelet', label: 'Vòng tay', price: 30000, items: [
    ['Sao Xinh Xắn', 'Đại diện sự tự tin và tỏa sáng, hãy cứ là phiên bản nổi bật nhất chính mình.'],
    ['Xanh Lấp Blink', 'Sắc xanh của tự do, bình yên, thêm chút lấp lánh cho cá tính riêng.'],
    ['Red Chói Chói', 'Sắc đỏ mạnh mẽ, quyết đoán và không ngại khác biệt.'],
    ['Tím Mọng Mer', 'Một chút mộng mơ, một chút bí ẩn cho những tâm hồn có thế giới riêng.'],
    ['Hồng Hây Hey', 'Nguồn năng lượng hồng hào rực rỡ cho những nàng yêu bản thân và sống theo cảm xúc.'],
    ['Nắng Ưiii', 'Mang một chút nắng bên người, để ngày nào cũng có lý do để vui.'],
    ['Kẹo Bông Hằm', 'Ngọt ngào, đáng yêu nhưng không nhạt nhòa.'],
  ] },
  { prefix: 'strap', category: 'card-strap', label: 'Dây đeo thẻ', price: 49000, items: [
    ['Xương Danh', 'Dây đeo thẻ sinh viên handmade.'],
    ['Xa Lánh', 'Dây đeo thẻ sinh viên handmade.'],
    ['Đỏ Đo', 'Dây đeo thẻ sinh viên handmade.'],
    ['Hèo Bông', 'Dây đeo thẻ sinh viên handmade.'],
  ] },
  { prefix: 'keychain', category: 'keychain', label: 'Móc khóa', price: 35000, items: [
    ['Bông Xa Lánh', 'Móc khóa handmade.'],
    ['Bông Vàng Khè', 'Móc khóa handmade.'],
    ['Bông Hồng Lầy', 'Móc khóa handmade.'],
    ['Bông Dưới Biển', 'Móc khóa handmade.'],
    ['Bông Ngành', 'Móc khóa handmade.'],
  ] },
];
const FALLBACK_PRODUCTS = GROUPS.flatMap((group) => group.items.map(([name, description], index) => ({
  id: `${group.prefix}-${index + 1}`,
  name,
  category: group.category,
  categoryLabel: group.label,
  price: group.price,
  image: `/products/${group.prefix}-${index + 1}.png`,
  description,
})));
const money = (value) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
const totalOf = (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const readCart = () => { try { return JSON.parse(localStorage.getItem('hamlay-cart') || '[]'); } catch { return []; } };
const categories = [{ id: 'all', label: 'Tất cả món xinh' }, ...GROUPS.map((group) => ({ id: group.category, label: group.label }))];

// Surfaces that already react to taps; a double-tap on them must keep working as before.
const CURSOR_BLOCKERS = 'a,button,input,textarea,select,label,summary,[role="button"],.site-nav,.music-toggle,.charm-mascot-core,.modal-backdrop,.drawer-backdrop,.toast';
const announceCursor = (x, y, active) => window.dispatchEvent(new CustomEvent('hamlay-cursor', { detail: { x, y, active } }));

function CharmCursor() {
  const reduce = useReducedMotion();
  const particles = useRef([]);
  const trail = useRef(null);
  useEffect(() => {
    if (reduce) return undefined;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const points = Array.from({ length: 22 }, (_, index) => ({ x: -80 - index * 4, y: -80 - index * 4 }));
    // Touch cursor glides slower than a mouse one so the run to the tapped spot is visible.
    const lead = fine ? .34 : .13; const drag = fine ? .2 : .11; const floor = fine ? .08 : .045;
    let target = { x: -80, y: -80 }; let frame = 0;
    const tick = () => {
      points.forEach((point, index) => { const follow = index === 0 ? lead : Math.max(floor, drag - index * (fine ? .005 : .003)); point.x += (target.x - point.x) * follow; point.y += (target.y - point.y) * follow; const node = particles.current[index]; if (node) { node.style.transform = `translate3d(${point.x}px,${point.y}px,0) scale(${1 - index * .03})`; node.style.opacity = String(Math.max(.16, 1 - index * .038)); } });
      if (!fine) announceCursor(points[0].x, points[0].y, true);
      frame = requestAnimationFrame(tick);
    };
    if (fine) {
      document.body.classList.add('has-charm-cursor');
      const move = (event) => { target = { x: event.clientX, y: event.clientY }; };
      window.addEventListener('pointermove', move, { passive: true }); frame = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); document.body.classList.remove('has-charm-cursor'); };
    }
    // Touch: no hover, so a double-tap on an empty spot summons the cursor and sends it running there.
    const layer = trail.current; if (!layer) return undefined;
    layer.classList.add('is-touch');
    let live = false; let down = null; let lastTap = null; let swallow = false; let hideTimer = 0; let stopTimer = 0; let anchorY = 0;
    const summon = (x, y) => {
      clearTimeout(hideTimer); clearTimeout(stopTimer);
      if (!live) { live = true; layer.classList.add('is-live'); points.forEach((point) => { point.x = -30; point.y = window.innerHeight + 30; }); }
      target = { x, y }; anchorY = window.scrollY;
      if (!frame) frame = requestAnimationFrame(tick);
      hideTimer = setTimeout(dismiss, 5000);
    };
    function dismiss() {
      if (!live) return;
      live = false; layer.classList.remove('is-live'); announceCursor(0, 0, false);
      stopTimer = setTimeout(() => { cancelAnimationFrame(frame); frame = 0; }, 450);
    }
    // The cursor is pinned to the screen, so real scrolling (not a tiny nudge) dismisses it.
    const onScroll = () => { if (Math.abs(window.scrollY - anchorY) > 24) dismiss(); };
    const onDown = (event) => { if (event.pointerType !== 'touch' || !event.isPrimary) return; down = { x: event.clientX, y: event.clientY, at: performance.now(), free: !event.target.closest?.(CURSOR_BLOCKERS) }; };
    const onUp = (event) => {
      if (event.pointerType !== 'touch' || !down) return;
      const start = down; down = null; const now = performance.now();
      if (!start.free || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12 || now - start.at > 350) { lastTap = null; return; }
      if (lastTap && now - lastTap.at < 400 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 48) { lastTap = null; swallow = true; summon(event.clientX, event.clientY); return; }
      lastTap = { x: event.clientX, y: event.clientY, at: now };
    };
    const cancel = () => { down = null; lastTap = null; };
    // A double-tap would otherwise select the word under the finger.
    const onTouchEnd = (event) => { if (!swallow) return; swallow = false; if (event.cancelable) event.preventDefault(); };
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', cancel, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(hideTimer); clearTimeout(stopTimer); cancelAnimationFrame(frame); announceCursor(0, 0, false);
      layer.classList.remove('is-touch', 'is-live');
      window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchend', onTouchEnd); window.removeEventListener('scroll', onScroll);
    };
  }, [reduce]);
  if (reduce) return null;
  const glyphs = ['✦', '✧', '⋆', '·', '✦', '˙', '✧', '⋆', '·', '✦', '✧', '·', '⋆', '✦', '˙', '✧', '·', '✦', '⋆', '✧', '·', '✦'];
  return <div className="cursor-trail" ref={trail} aria-hidden="true">{glyphs.map((glyph, index) => <i key={index} ref={(node) => { particles.current[index] = node; }} className={index === 0 ? 'cursor-core' : 'cursor-dust'}>{glyph}</i>)}</div>;
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
    // The touch cursor (double-tap) has no real pointer events, so it announces its position instead.
    let following = false;
    const follow = (event) => {
      const { x, y, active } = event.detail; const rect = node.getBoundingClientRect();
      if (active && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) { following = true; move({ clientX: x, clientY: y, pointerType: 'synthetic', pointerId: -1 }); }
      else if (following) { following = false; end({ pointerType: 'synthetic', pointerId: -1 }); }
    };
    window.addEventListener('hamlay-cursor', follow);
    return () => {
      window.removeEventListener('hamlay-cursor', follow);
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
  const links = [['Về tiệm', '#story'], ['Sản phẩm', '#products'], ['Tặng quà', '#gift'], ['Chính sách', '#policy'], ['Liên hệ', '#contact']];
  return <header className="site-nav"><div className="container nav-inner"><a className="wordmark wordmark-logo" href="#top" onClick={() => setOpen(false)} aria-label="Tiệm ham lầy"><img src="/brand/logo.png" alt="Tiệm ham lầy" /></a><nav className={`nav-links ${open ? 'is-open' : ''}`}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<a className="nav-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a></nav><button className="nav-cart" onClick={onCart} aria-label={`Mở giỏ hàng, ${count} sản phẩm`}><ShoppingBag size={18} /><span>{count}</span></button><button className="nav-menu" onClick={() => setOpen((value) => !value)} aria-label="Mở menu">{open ? <X size={21} /> : <Menu size={21} />}</button></div></header>;
}

function Hero({ onExplore, total }) {
  const reduce = useReducedMotion(); const sceneRef = usePointerParallax();
  return <section className="hero hero-upgraded" id="top"><div className="hero-noise" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-laser laser-one" /><div className="hero-laser laser-two" /><div className="container hero-grid"><motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75 }}><p className="eyebrow">TIỆM HAM LẦY · HANDMADE</p><h1>Vòng đẹp bạn đeo,<br /><em>vòng lỗi shop đổi.</em></h1><p className="hero-lede">Tiệm ham lầy chuyên bán những sản phẩm handmade như vòng tay, dây đeo thẻ sinh viên và móc khóa. Ngoài bán vòng đẹp, tụi mình còn bán niềm vui.</p><div className="hero-actions"><a className="button button-red" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={17} /> Mua nhanh qua Instagram</a><button className="button button-blue" onClick={onExplore}>Xem sản phẩm <ArrowRight size={17} /></button><a className="text-link" href="#story">Tiệm là ai vậy? <ArrowDown size={15} /></a></div><div className="hero-note"><span className="note-dot" /> hoạt động từ tháng 9/2026 <span>·</span> {total} món đang lấp lánh</div></motion.div><motion.div ref={sceneRef} className="hero-stage hero-stage-upgraded" initial={reduce ? false : { opacity: 0, scale: .84, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: .15, duration: .95, type: 'spring' }}><div className="hero-3d-scene"><div className="hero-glow" /><div className="hero-ring ring-a" /><div className="hero-ring ring-b" /><div className="hero-ring ring-c" /><div className="hero-bead bead-a" /><div className="hero-bead bead-b" /><div className="hero-bead bead-c" /><div className="hero-bead bead-d" /><div className="hero-brand-stage"><img className="hero-mascot" src="/brand/mascot.png" alt="Mascot của Tiệm ham lầy" /><figure className="hero-photo hero-photo-one"><img src="/products/bracelet-3.png" alt="Vòng tay Red Chói Chói" /></figure><figure className="hero-photo hero-photo-two"><img src="/products/keychain-3.png" alt="Móc khóa Bông Hồng Lầy" /></figure><figure className="hero-photo hero-photo-three"><img src="/products/strap-3.png" alt="Dây đeo thẻ Đỏ Đo" /></figure></div><div className="hero-float-tag tag-one">handmade ♡</div><div className="hero-float-tag tag-two">{total} món xinh</div><span className="hero-heart">♡</span><span className="hero-star">✦</span><div className="hero-spark-field"><i>✦</i><i>✧</i><i>·</i><i>✦</i><i>·</i></div></div></motion.div></div><div className="hero-scroll"><span>cuộn xuống xem tiệm</span><ArrowDown size={15} /></div></section>;
}

function Story() {
  const reduce = useReducedMotion();
  const pillars = [
    { title: 'Tên thương hiệu', icon: Sparkles, tone: 'pillar-pink', copy: <>Tiệm ham lầy được thiết kế với 2 ý tưởng chính: <b>ham lầy</b> (tiếng Việt) là ham muốn mang niềm vui đến khách hàng; <b>hamorny layout</b> (tiếng Anh, viết tắt từ ham và lay) là sự chỉn chu trong từng sản phẩm đến tay khách hàng.</>, foot: 'Lầy ngoài bán vòng đẹp, chúng tôi còn bán niềm vui.' },
    { title: 'Tầm nhìn', icon: Eye, tone: 'pillar-yellow', copy: 'Tầm nhìn của lầy trong 5 năm tới mong muốn trở thành tiệm phụ kiện handmade hàng đầu Việt Nam, được khách hàng tin chọn nhờ sản phẩm chất lượng và sự tận tâm trong từng trải nghiệm.', foot: 'Trong 5 năm tới' },
    { title: 'Sứ mệnh', icon: Target, tone: 'pillar-pink', copy: 'Mang đến những sản phẩm handmade đẹp, chỉn chu và chất lượng, đồng thời đảm bảo quyền lợi khách hàng với cam kết:', foot: '“Vòng đẹp bạn đeo - vòng lỗi shop đổi.”' },
  ];
  const rise = (index = 0) => reduce ? {} : { initial: { opacity: 0, y: 38 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-70px' }, transition: { delay: index * .1, type: 'spring', stiffness: 90, damping: 16 } };
  return <section className="section about-section" id="story"><div className="container"><div className="about-intro"><motion.div className="about-copy" {...rise()}><p className="eyebrow">ĐÔI NÉT VỀ LẦY</p><h2>Đôi chút <em>về lầy...</em></h2><p>Tiệm ham lầy (hay còn gọi là lầy) được thành lập vào tháng 9 năm 2026 bởi nhóm 9 bạn sinh viên cùng tham gia dự án truyền thông trong khuôn khổ học phần Truyền thông số tại trường Đại học Văn Lang.</p><p>Tiệm ham lầy chúng tớ chuyên bán những sản phẩm handmade như vòng tay, dây đeo thẻ sinh viên và móc khóa. Với mong muốn mỗi món đồ nhỏ khi đến tay bạn không chỉ đẹp, dễ thương mà còn mang lại một chút niềm vui, tiếng cười và hạnh phúc trong những điều nhỏ bé hằng ngày của bạn!</p></motion.div><motion.div className="about-mascot" {...rise(1)}><img src="/brand/mascot.png" alt="Mascot của Tiệm ham lầy" loading="lazy" /></motion.div></div><div className="pillar-grid">{pillars.map(({ title, icon: Icon, tone, copy, foot }, index) => <motion.article className={`pillar ${tone}`} key={title} {...rise(index)}><span className="pillar-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div className="pillar-head"><span className="pillar-icon"><Icon size={22} /></span><h3>{title}</h3></div><p>{copy}</p><div className="pillar-foot">{foot}</div></motion.article>)}</div><motion.div className="about-time" {...rise()}><div className="about-time-item"><span className="about-time-icon"><CalendarDays size={22} /></span><div><small>thời gian hoạt động</small><strong>Từ tháng 9 năm 2026</strong></div></div><div className="about-time-item"><span className="about-time-icon"><Globe size={22} /></span><div><small>kênh liên hệ</small><strong>Luôn hoạt động trên mọi nền tảng</strong></div></div><a className="button button-red" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={17} /> Nhắn Lầy qua Instagram</a></motion.div><motion.div className="about-whisper" {...rise()}><h3>Đôi nét tâm sự của lầy:</h3><p>Ngoài <em>vòng xinh</em>, <em>giá hợp lý</em>, <em>tư vấn nhiệt tình</em>, <em>đổi trả 1-1</em>, lầy còn rất lầy lội. Và nếu bạn không thích vòng vo, bạn có lẽ đang thích vòng tay nhà lầy. Lầy làm lắc lấy liền luôn, lầy làm lời lắm, lỗ là lầy LO.</p></motion.div></div></section>;
}

function CharmLab({ products, onOpen }) {
  const ref = usePointerParallax(); const [mixIndex, setMixIndex] = useState(0);
  const mix = products[mixIndex % Math.max(products.length, 1)];
  const picks = ['bracelet-3', 'keychain-3', 'bracelet-1', 'strap-3', 'bracelet-5', 'keychain-4', 'bracelet-2', 'strap-1', 'bracelet-6'].map((id) => products.find((item) => item.id === id)).filter(Boolean);
  const featured = picks.length >= 6 ? picks : products.slice(0, 9);
  return <section className="section charm-lab" id="charm-lab"><div className="container charm-lab-grid"><div><p className="eyebrow">GÓC THỬ VIBE</p><h2>Chạm vào một<br /><em>món lấp lánh.</em></h2><p>Rê chuột quanh các món đang bay lơ lửng để mở chi tiết. Bấm bạn mascot ở giữa để đổi món đang mix — trên điện thoại cũng chơi được nha.</p><span className="charm-lab-tip"><RotateCcw size={15} /> bấm để mix vibe mới</span></div><div className="charm-stage-3d" ref={ref}><div className="charm-orbit orbit-x" /><div className="charm-orbit orbit-y" /><button type="button" className="charm-mascot-core" onClick={() => setMixIndex((value) => value + 1)} aria-label="Đổi món đang mix"><img className="charm-mascot-img" src="/brand/mascot.png" alt="" /><span className="charm-mascot-prompt">chạm để<br /><b>đổi vibe</b></span></button><span className="charm-mix-label" aria-live="polite">đang mix · {mix?.name || 'món xinh'}</span><div className="charm-cards-orbit">{featured.map((product, index) => <button key={product.id} className={`flying-charm flying-charm-${index + 1}`} onClick={() => onOpen(product)} aria-label={`Mở ${product.name}`}><img src={product.image} alt="" loading="lazy" /><i>{index % 2 ? '✧' : '✦'}</i></button>)}</div><span className="lab-star star-one">✦</span><span className="lab-star star-two">✧</span></div></div></section>;
}

function GalleryContact() {
  return <section className="section gallery-contact" id="gallery"><div className="container"><div className="section-heading"><div><p className="eyebrow">COMBO 20·10</p><h2>Combo<br /><em>yêu thương.</em></h2></div><p>Các combo vòng tay, dây đeo thẻ và móc khóa của tiệm.</p></div><div className="gallery-grid">{[1, 2, 3, 4].map((index) => <div className={`gallery-tile gallery-tile-${index}`} key={index}><img src={`/products/combo-${index}.png`} alt={`Combo yêu thương ${index}`} loading="lazy" /><span>combo 20·10 ✦</span></div>)}</div></div></section>;
}

// Where the bracelet sits in each model photo (fraction of width / height), so the round lens can zoom onto the wrist.
const MODEL_WRISTS = [{ x: .3, y: .51 }, { x: .53, y: .66 }, { x: .495, y: .59 }, { x: .425, y: .67 }];
function ModelSection() {
  const reduce = useReducedMotion(); const zoom = 4; const ratio = 1.25;
  const lens = ({ x, y }) => ({ backgroundSize: `${zoom * 100}% auto`, backgroundPosition: `${((x * zoom - .5) / (zoom - 1) * 100).toFixed(1)}% ${((y * zoom * ratio - .5) / (zoom * ratio - 1) * 100).toFixed(1)}%` });
  return <section className="section model-section" id="model"><div className="container"><div className="section-heading"><div><p className="eyebrow">NGƯỜI MẪU CHỤP</p><h2>Thử đeo<br /><em>lên tay.</em></h2></div><p>Ảnh người mẫu chụp thật của tiệm. Vòng tròn nhỏ phóng to đúng cổ tay đang đeo vòng.</p></div><div className="model-grid">{MODEL_WRISTS.map((wrist, index) => <motion.figure className="model-card" key={index} initial={reduce ? false : { opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * .08, type: 'spring', stiffness: 90, damping: 16 }}><div className="model-photo"><img src={`/products/model-${index + 1}.png`} alt={`Người mẫu đeo vòng tay Tiệm ham lầy ${index + 1}`} loading="lazy" /></div><div className="model-lens" style={{ backgroundImage: `url(/products/model-${index + 1}.png)`, ...lens(wrist) }} role="img" aria-label="Cận cảnh vòng tay trên cổ tay người mẫu" /><figcaption>vòng tay · thử đeo</figcaption></motion.figure>)}</div></div></section>;
}

function Policy() {
  const boxes = [
    { title: 'Về giao hàng', icon: Truck, tone: 'policy-paper', stat: ['5', 'sản phẩm trở lên · freeship'], lines: [<>Đơn hàng <em>3 sản phẩm</em> bất kỳ trở lên, ham lầy hỗ trợ <em>50% ship cod</em></>, <>Đơn hàng <em>5 sản phẩm</em> bất kỳ trở lên, ham lầy <em>freeship</em></>, <>Địa chỉ nhận hàng nằm trong <em>bán kính 5km</em> tính từ Trường Đại học Văn Lang (Cơ sở 2, Cơ sở 3), ham lầy <em>freeship</em></>] },
    { title: 'Về thanh toán (cọc tiền)', icon: Wallet, tone: 'policy-pink', stat: ['50%', 'cọc giá trị đơn hàng'], lines: [<>Khách hàng cần <em>cọc 50%</em> giá trị đơn hàng trong các trường hợp sau:</>, <>Đơn hàng có giá trị từ <em>300.000đ trở lên</em></>, <>Khách hàng <em>lần đầu tiên</em> đặt đơn tại tiệm ham lầy</>] },
    { title: 'Về bảo hành', icon: ShieldCheck, tone: 'policy-paper', stat: ['100%', 'hoàn tiền · không cần trả hàng'], lines: [<>Lầy cam kết <em>hoàn tiền 100%</em> giá trị sản phẩm (bạn không cần trả hàng) nếu sản phẩm bạn nhận được <em>khác 5%</em> (tương đương với 1 charm) so với hình ảnh sản phẩm mẫu hoặc video thực tế lầy đăng tải.</>] },
  ];
  return <section className="section policy-section" id="policy"><div className="container"><div className="section-heading"><div><p className="eyebrow">CHÍNH SÁCH Ở LẦY</p><h2>Rõ ràng để bạn<br /><em>yên tâm đặt.</em></h2></div><p>Vòng đẹp bạn đeo - vòng lỗi shop đổi.</p></div><div className="policy-grid">{boxes.map(({ title, icon: Icon, tone, stat, lines }) => <article className={`policy-box ${tone}`} key={title}><div className="policy-head"><span className="policy-icon"><Icon size={22} /></span><h3>{title}</h3></div><div className="policy-stat"><b>{stat[0]}</b><span>{stat[1]}</span></div><ul>{lines.map((line, index) => <li key={index}>{line}</li>)}</ul></article>)}</div></div></section>;
}

function Contact() {
  return <section className="section contact-section" id="contact"><div className="container"><div className="contact-head"><img className="contact-logo" src="/brand/logo.png" alt="Tiệm ham lầy" loading="lazy" /><div><p className="eyebrow">LIÊN HỆ VỚI LẦY</p><h2>Liên hệ với lầy<br /><em>để đặt hàng nhé!</em></h2><p>Lầy luôn hoạt động trên mọi nền tảng và rất vui khi bạn liên hệ lầy.</p><a className="button button-red contact-instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={18} /> Mua nhanh qua Instagram</a></div></div><div className="social-wall">{SOCIALS.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={17} /> {label} <span aria-hidden="true">↗</span></a>)}</div></div></section>;
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

function GiftExperience({ onGift }) {
  const reduce = useReducedMotion(); const target = 'Gửi bạn một món nhỏ xíu, mong bạn vui thiệt nhiều ✦'; const [note, setNote] = useState(''); const [typing, setTyping] = useState(true); const [editing, setEditing] = useState(false); const cardRef = useRef(null);
  useEffect(() => { const node = cardRef.current; if (!node) return undefined; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !note && !editing) { setTyping(true); let index = 0; const timer = setInterval(() => { index += 1; setNote(target.slice(0, index)); if (index >= target.length) { clearInterval(timer); setTyping(false); } }, 48); observer.disconnect(); return () => clearInterval(timer); } }, { threshold: .45 }); observer.observe(node); return () => observer.disconnect(); }, [target, note, editing]);
  return <section className="section gift-section gift-section-upgraded" id="gift"><div className="container gift-grid"><div className="gift-copy"><p className="eyebrow">MỘT MÓN QUÀ CÓ LỜI</p><h2>Quà nhỏ xíu,<br /><em>lời thương to thiệt to.</em></h2><p>Bật chế độ tặng quà khi checkout, điền tên người nhận và lời chúc. Tụi mình sẽ lưu lại cùng đơn để shop không bỏ quên phần dễ thương nhất.</p><button className="button button-blue" onClick={onGift}><Gift size={17} /> Tặng ai đó một món</button></div><div className="gift-card-wrap" ref={cardRef}><div className="gift-ribbon ribbon-one" /><div className="gift-ribbon ribbon-two" /><motion.div className="gift-card gift-card-upgraded" initial={reduce ? false : { opacity: 0, rotate: -12, y: 35 }} whileInView={{ opacity: 1, rotate: -4, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 100 }}><div className="gift-card-top">to: người thương của tui <Heart size={16} fill="currentColor" /></div><textarea value={note} maxLength={140} onFocus={() => { setEditing(true); setTyping(false); }} onChange={(event) => setNote(event.target.value)} aria-label="Lời chúc có thể chỉnh sửa" /><span className={`gift-type-caret ${typing ? 'is-typing' : ''}`} aria-hidden="true">✦</span><div className="gift-edit-hint"><span>{typing ? 'đang viết lời thương...' : '✎ bấm vào dòng chữ để sửa lời chúc'}</span><span>{note.length}/140</span></div><div className="gift-card-footer"><span>with a little sparkle</span><span>tiệm ham lầy ✦</span></div></motion.div><span className="gift-spark spark-one">✦</span><span className="gift-spark spark-two">✧</span><span className="gift-spark spark-three">·</span><span className="gift-spark spark-four">✦</span></div></div></section>;
}

function HowToOrder() {
  const reduce = useReducedMotion(); const steps = [['01', 'Chọn món', 'Lượn một vòng, thấy món nào tim rung thì cho vào giỏ.', '✦'], ['02', 'Điền thông tin', 'Cho tiệm biết bạn là ai và muốn gửi món đến đâu.', '♡'], ['03', 'Gửi đơn', 'Tụi mình nhận đơn, kiểm tra rồi nhắn lại nếu cần.', '↗'], ['04', 'Chuyển khoản', 'Làm theo thông tin thanh toán; gửi đơn chưa có nghĩa là đã xác nhận thanh toán nha.', '✧']];
  return <section className="section how-section how-section-upgraded" id="how"><div className="container"><div className="section-heading"><div><p className="eyebrow">ĐẶT HÀNG DỄ ƠI LÀ DỄ</p><h2>Đi cùng Lầy qua <em>4 nhịp.</em></h2></div><p>Có gì chưa rõ cứ nhắn tiệm. Tận tâm là nghề tay trái, làm đồ xinh mới là nghề tay phải.</p></div><div className="steps-grid steps-grid-upgraded">{steps.map(([number, title, copy, icon], index) => <motion.article className={`step step-upgraded step-${index + 1}`} key={number} initial={reduce ? false : { opacity: 0, y: 35, rotate: index % 2 ? 3 : -3 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * .1, type: 'spring' }} whileHover={reduce ? {} : { y: -12, rotate: index % 2 ? -2 : 2 }}><span className="step-number">{number}</span><b className="step-icon">{icon}</b><span className="step-spark-line" /><h3>{title}</h3><p>{copy}</p></motion.article>)}</div></div></section>;
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

function Footer() { return <footer className="site-footer"><div className="container footer-grid"><div><a href="#top" className="wordmark wordmark-logo" aria-label="Tiệm ham lầy"><img src="/brand/logo.png" alt="Tiệm ham lầy" loading="lazy" /></a><p>Vòng đẹp bạn đeo,<br />vòng lỗi shop đổi.</p></div><div><small>ghé chơi với tiệm</small><a href="#story">Về tiệm</a><a href="#products">Sản phẩm</a><a href="#gift">Tặng quà</a><a href="#policy">Chính sách</a></div><div><small>tìm thấy tụi mình</small>{SOCIALS.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer"><Icon size={15} /> {label}</a>)}<span><Mail size={15} /> tiemnhalayhandmade@gmail.com</span></div></div><div className="container footer-bottom"><span>© 2026 Tiệm Ham Lầy</span><span>handmade bởi nhóm 9 bạn sinh viên Văn Lang ♡</span></div></footer>; }

function InstagramToast({ items, onClose }) {
  const message = items.map((item) => `Tui muốn đặt ${item.name} × ${item.quantity || 1}, tư vấn giúp mình nhé`).join('\n');
  useEffect(() => { navigator.clipboard?.writeText(message).catch(() => {}); const timer = setTimeout(onClose, 6000); return () => clearTimeout(timer); }, [message, onClose]);
  return <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}><Check size={18} /><span>Đã copy lời nhắn rồi, mở Instagram gửi tiệm nha.</span><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Mở Instagram <ArrowRight size={14} /></a><button onClick={onClose}><X size={15} /></button></motion.div>;
}

export default function LandingPage() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS); const [cart, setCart] = useState(readCart); const [drawer, setDrawer] = useState(false); const [detail, setDetail] = useState(null); const [orderOpen, setOrderOpen] = useState(false); const [success, setSuccess] = useState(null); const [insta, setInsta] = useState(null);
  useEffect(() => { fetchProducts().then((data) => { if (Array.isArray(data) && data.length) setProducts(data); }).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem('hamlay-cart', JSON.stringify(cart)); }, [cart]);
  const add = (product, quantity = 1) => { setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { ...product, quantity }]; }); setDrawer(true); };
  const openInstagram = (items) => { const message = items.map((item) => `Tui muốn đặt ${item.name} × ${item.quantity || 1}, tư vấn giúp mình nhé`).join('\n'); navigator.clipboard?.writeText(message).catch(() => {}); window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer'); setInsta(items); };
  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const jumpToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  return <div className="site-shell"><CharmCursor /><AmbientMusic /><Navigation count={count} onCart={() => setDrawer(true)} /><main><Hero onExplore={jumpToProducts} total={products.length} /><Story /><Products products={products} onAdd={add} onOpen={setDetail} onInstagram={openInstagram} /><CharmLab products={products} onOpen={setDetail} /><GiftExperience onGift={jumpToProducts} /><HowToOrder /><section className="payment-band"><div className="container payment-band-inner"><Sparkles size={24} /><span><strong>Chuyển khoản rõ ràng, kiểm tra thủ công.</strong> Gửi đơn không tự động đánh dấu đã thanh toán.</span><a href="#how">Xem quy trình <ArrowRight size={15} /></a></div></section><GalleryContact /><ModelSection /><Policy /><Contact /></main><Footer /><AnimatePresence>{drawer && <CartDrawer items={cart} setItems={setCart} onCheckout={() => { setDrawer(false); setOrderOpen(true); }} onClose={() => setDrawer(false)} onInstagram={openInstagram} />}{detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onAdd={add} onInstagram={openInstagram} />}{orderOpen && <OrderModal items={cart} onClose={() => setOrderOpen(false)} onSuccess={(result) => { setCart([]); setOrderOpen(false); setSuccess(result); }} />}{success && <SuccessModal result={success} onClose={() => setSuccess(null)} />}{insta && <InstagramToast items={insta} onClose={() => setInsta(null)} />}</AnimatePresence></div>;
}
