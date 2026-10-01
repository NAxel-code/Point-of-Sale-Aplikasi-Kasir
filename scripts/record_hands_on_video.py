import os
import json
import time
import subprocess
from playwright.sync_api import sync_playwright
import imageio_ffmpeg

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
BASE_URL = "http://localhost:3008"
PROJECT_DIR = os.getcwd()
AUDIO_DIR = os.path.join(PROJECT_DIR, "video_assets", "audio")
VIDEO_TEMP_DIR = os.path.join(PROJECT_DIR, "video_assets", "raw_video")
DOWNLOADS_DIR = os.path.expanduser(r"~\Downloads")
FINAL_OUTPUT_MP4 = os.path.join(DOWNLOADS_DIR, "hands_on_aplikasi_kasir_pos.mp4")

INIT_SCRIPT = """
window.__showDemoBanner = function(title, subtitle) {
  let style = document.getElementById('demo-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'demo-style';
    style.innerHTML = `
      @keyframes soundWave {
        0% { height: 6px; }
        100% { height: 18px; }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translate(-50%, 15px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      #demo-cursor {
        position: fixed;
        width: 24px;
        height: 24px;
        border: 2px solid #f59e0b;
        background: rgba(245, 158, 11, 0.4);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%);
        transition: transform 0.08s ease, width 0.15s, height 0.15s, background 0.15s;
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.7);
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  let cursor = document.getElementById('demo-cursor');
  if (!cursor && document.body) {
    cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    document.body.appendChild(cursor);
  }

  let b = document.getElementById('demo-banner');
  if (!b && document.body) {
    b = document.createElement('div');
    b.id = 'demo-banner';
    b.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:999999;background:rgba(9,9,11,0.95);backdrop-filter:blur(16px);border:1px solid rgba(245,158,11,0.5);border-radius:16px;padding:10px 22px;box-shadow:0 15px 35px rgba(0,0,0,0.85), 0 0 20px rgba(245,158,11,0.25);display:flex;align-items:center;gap:14px;min-width:620px;max-width:88%;animation:fadeInUp 0.3s ease-out;font-family:ui-sans-serif,system-ui,sans-serif;pointer-events:none;';
    document.body.appendChild(b);
  }
  if (b) {
    b.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#09090b;font-weight:900;font-size:17px;box-shadow:0 0 10px rgba(245,158,11,0.6);flex-shrink:0;">
        ☕
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:9.5px;font-weight:800;letter-spacing:0.06em;color:#f59e0b;text-transform:uppercase;">${title}</span>
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        </div>
        <div style="font-size:12px;font-weight:600;color:#f4f4f5;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${subtitle}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:3px;height:16px;">
        <span style="display:inline-block;width:3px;height:12px;background:#f59e0b;border-radius:2px;animation:soundWave 0.8s infinite ease-in-out alternate;"></span>
        <span style="display:inline-block;width:3px;height:18px;background:#f59e0b;border-radius:2px;animation:soundWave 0.6s infinite 0.2s ease-in-out alternate;"></span>
        <span style="display:inline-block;width:3px;height:8px;background:#f59e0b;border-radius:2px;animation:soundWave 0.9s infinite 0.4s ease-in-out alternate;"></span>
      </div>
    `;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('mousemove', (e) => {
    let cursor = document.getElementById('demo-cursor');
    if (!cursor && document.body) {
      cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      document.body.appendChild(cursor);
    }
    if (cursor) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }
  });

  document.addEventListener('mousedown', () => {
    let cursor = document.getElementById('demo-cursor');
    if (cursor) {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
      cursor.style.background = 'rgba(245, 158, 11, 0.85)';
    }
  });

  document.addEventListener('mouseup', () => {
    let cursor = document.getElementById('demo-cursor');
    if (cursor) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.background = 'rgba(245, 158, 11, 0.4)';
    }
  });
});
"""

def show_banner(page, title, subtitle):
    try:
        page.evaluate("(args) => { if (window.__showDemoBanner) window.__showDemoBanner(args[0], args[1]); }", [title, subtitle])
    except:
        pass

def sync_wait(scene_start, target_duration):
    elapsed = time.time() - scene_start
    remaining = target_duration - elapsed
    if remaining > 0:
        time.sleep(remaining)

def run_recording():
    os.makedirs(VIDEO_TEMP_DIR, exist_ok=True)
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)

    # Seed baseline demo transactions
    print("Menyiapkan database & data awal demo...")
    subprocess.run(["npx.cmd", "tsx", "scripts/seed_demo.ts"], shell=True, check=True)

    # Clean old webm in VIDEO_TEMP_DIR
    for f in os.listdir(VIDEO_TEMP_DIR):
        if f.endswith(".webm"):
            try:
                os.remove(os.path.join(VIDEO_TEMP_DIR, f))
            except:
                pass

    meta_file = os.path.join(AUDIO_DIR, "scenes_meta.json")
    with open(meta_file, "r", encoding="utf-8") as f:
        scenes = json.load(f)

    scene_map = {s["id"]: s for s in scenes}

    print("Memulai perekaman video hands-on via Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=VIDEO_TEMP_DIR,
            record_video_size={"width": 1280, "height": 720}
        )
        context.add_init_script(INIT_SCRIPT)
        page = context.new_page()

        # ====================================================================
        # SCENE 1: LOGIN & RBAC
        # ====================================================================
        s1 = scene_map["scene1_login"]
        t1 = time.time()
        print(f"-> Merekam {s1['id']} (durasi: {s1['duration']:.2f}s)...")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_selector("text=Mr.Coffee Terminal")
        show_banner(page, s1['title'], s1['subtitle'])

        page.mouse.move(640, 160, steps=15)
        page.wait_for_timeout(2000)
        # Hover security badges
        page.mouse.move(640, 680, steps=20)
        page.wait_for_timeout(2500)
        # Move to Cashier demo button
        cashier_btn = page.locator("button:has-text('Role: CASHIER')")
        box = cashier_btn.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=20)
            page.wait_for_timeout(2000)
            cashier_btn.click()

        # Wait for redirect to /pos
        page.wait_for_url("**/pos", timeout=10000)
        show_banner(page, s1['title'], s1['subtitle'])
        sync_wait(t1, s1["duration"])

        # ====================================================================
        # SCENE 2: TERMINAL POS & KATALOG MENU
        # ====================================================================
        s2 = scene_map["scene2_catalog"]
        t2 = time.time()
        print(f"-> Merekam {s2['id']} (durasi: {s2['duration']:.2f}s)...")
        show_banner(page, s2['title'], s2['subtitle'])

        # Hover header clock
        page.mouse.move(300, 32, steps=15)
        page.wait_for_timeout(2000)

        # Click categories: Non Kopi -> Kopi -> Semua Menu
        non_kopi = page.locator("button:has-text('Non Kopi')")
        if non_kopi.count() > 0:
            box = non_kopi.first.bounding_box()
            if box:
                page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
                page.wait_for_timeout(1000)
                non_kopi.first.click()
                page.wait_for_timeout(2500)

        kopi = page.locator("button:has-text('Kopi')")
        if kopi.count() > 0:
            box = kopi.first.bounding_box()
            if box:
                page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
                page.wait_for_timeout(1000)
                kopi.first.click()
                page.wait_for_timeout(2500)

        semua = page.locator("button:has-text('Semua Menu')")
        if semua.count() > 0:
            box = semua.first.bounding_box()
            if box:
                page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
                page.wait_for_timeout(1000)
                semua.first.click()
                page.wait_for_timeout(2000)

        # Search bar test
        search_input = page.locator("input[placeholder*='Cari menu']")
        if search_input.count() > 0:
            s_box = search_input.first.bounding_box()
            if s_box:
                page.mouse.move(s_box["x"] + s_box["width"]/2, s_box["y"] + s_box["height"]/2, steps=15)
                search_input.first.click()
                page.keyboard.type("Espresso", delay=120)
                page.wait_for_timeout(2000)
                # clear search
                clear_btn = page.locator("button:has(svg.lucide-x)")
                if clear_btn.count() > 0:
                    clear_btn.first.click()
                else:
                    search_input.first.fill("")
                page.wait_for_timeout(2000)

        sync_wait(t2, s2["duration"])

        # ====================================================================
        # SCENE 3: PEMILIHAN MENU & TIKET PESANAN
        # ====================================================================
        s3 = scene_map["scene3_cart"]
        t3 = time.time()
        print(f"-> Merekam {s3['id']} (durasi: {s3['duration']:.2f}s)...")
        show_banner(page, s3['title'], s3['subtitle'])

        # Click Espresso product card
        espresso = page.locator("h3:has-text('Espresso')").first
        box = espresso.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            espresso.click()
            page.wait_for_timeout(1000)
            espresso.click() # 2x
            page.wait_for_timeout(1500)

        # Click Cafe Latte
        latte = page.locator("h3:has-text('Latte')").first
        if latte.count() > 0:
            box = latte.bounding_box()
            if box:
                page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
                page.wait_for_timeout(800)
                latte.click()
                page.wait_for_timeout(1500)

        # Move to cart panel
        customer_input = page.locator("input[placeholder*='Pelanggan']")
        if customer_input.count() > 0:
            c_box = customer_input.first.bounding_box()
            if c_box:
                page.mouse.move(c_box["x"] + c_box["width"]/2, c_box["y"] + c_box["height"]/2, steps=15)
                customer_input.first.click()
                page.keyboard.type("Budi Santoso", delay=100)
                page.wait_for_timeout(1500)

        table_input = page.locator("input[placeholder*='Meja']")
        if table_input.count() > 0:
            t_box = table_input.first.bounding_box()
            if t_box:
                page.mouse.move(t_box["x"] + t_box["width"]/2, t_box["y"] + t_box["height"]/2, steps=15)
                table_input.first.click()
                page.keyboard.type("08", delay=100)
                page.wait_for_timeout(1500)

        # Select Dine In
        dine_in = page.locator("button:has-text('Dine In')")
        if dine_in.count() > 0:
            d_box = dine_in.first.bounding_box()
            if d_box:
                page.mouse.move(d_box["x"] + d_box["width"]/2, d_box["y"] + d_box["height"]/2, steps=12)
                dine_in.first.click()
                page.wait_for_timeout(1000)

        sync_wait(t3, s3["duration"])

        # ====================================================================
        # SCENE 4: CHECKOUT & MULTI-METODE PEMBAYARAN
        # ====================================================================
        s4 = scene_map["scene4_checkout"]
        t4 = time.time()
        print(f"-> Merekam {s4['id']} (durasi: {s4['duration']:.2f}s)...")
        show_banner(page, s4['title'], s4['subtitle'])

        # Click Bayar Sekarang button
        pay_btn = page.locator("button:has-text('Bayar Sekarang')")
        box = pay_btn.first.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            pay_btn.first.click()
            page.wait_for_timeout(2000)

        # Modal is open: click QRIS
        qris_btn = page.locator("button:has-text('QRIS')")
        if qris_btn.count() > 0:
            q_box = qris_btn.first.bounding_box()
            if q_box:
                page.mouse.move(q_box["x"] + q_box["width"]/2, q_box["y"] + q_box["height"]/2, steps=15)
                qris_btn.first.click()
                page.wait_for_timeout(3000)

        # Click Debit / EDC
        card_btn = page.locator("button:has-text('Debit / EDC')")
        if card_btn.count() > 0:
            c_box = card_btn.first.bounding_box()
            if c_box:
                page.mouse.move(c_box["x"] + c_box["width"]/2, c_box["y"] + c_box["height"]/2, steps=15)
                card_btn.first.click()
                page.wait_for_timeout(2500)

        # Back to Tunai / Cash
        cash_btn = page.locator("button:has-text('Tunai / Cash')")
        if cash_btn.count() > 0:
            cash_box = cash_btn.first.bounding_box()
            if cash_box:
                page.mouse.move(cash_box["x"] + cash_box["width"]/2, cash_box["y"] + cash_box["height"]/2, steps=15)
                cash_btn.first.click()
                page.wait_for_timeout(1500)

        # Click quick nominal button (e.g. 100.000)
        quick_btn = page.locator("button:has-text('100.000')")
        if quick_btn.count() == 0:
            quick_btn = page.locator("button:has-text('Pecahan')").first
        if quick_btn.count() > 0:
            qk_box = quick_btn.first.bounding_box()
            if qk_box:
                page.mouse.move(qk_box["x"] + qk_box["width"]/2, qk_box["y"] + qk_box["height"]/2, steps=15)
                quick_btn.first.click()
                page.wait_for_timeout(2500)

        # Click submit button
        submit_btn = page.locator("button:has-text('Selesaikan & Lihat Struk')")
        if submit_btn.count() > 0:
            s_box = submit_btn.first.bounding_box()
            if s_box:
                page.mouse.move(s_box["x"] + s_box["width"]/2, s_box["y"] + s_box["height"]/2, steps=15)
                page.wait_for_timeout(1000)
                submit_btn.first.click()
                page.wait_for_timeout(2000)

        sync_wait(t4, s4["duration"])

        # ====================================================================
        # SCENE 5: STRUK PEMBAYARAN THERMAL
        # ====================================================================
        s5 = scene_map["scene5_receipt"]
        t5 = time.time()
        print(f"-> Merekam {s5['id']} (durasi: {s5['duration']:.2f}s)...")
        show_banner(page, s5['title'], s5['subtitle'])

        # Struk is visible!
        page.wait_for_selector("#thermal-receipt", timeout=10000)
        page.mouse.move(640, 360, steps=20)
        page.wait_for_timeout(3000)

        # Smooth scroll receipt container
        receipt_container = page.locator("#thermal-receipt")
        r_box = receipt_container.bounding_box()
        if r_box:
            page.mouse.move(r_box["x"] + r_box["width"]/2, r_box["y"] + 200, steps=15)
            page.wait_for_timeout(3000)

        # Close receipt modal
        close_btn = page.locator("button:has(svg.lucide-x)")
        if close_btn.count() > 0:
            c_box = close_btn.first.bounding_box()
            if c_box:
                page.mouse.move(c_box["x"] + c_box["width"]/2, c_box["y"] + c_box["height"]/2, steps=15)
                page.wait_for_timeout(1500)
                close_btn.first.click()
                page.wait_for_timeout(2000)

        sync_wait(t5, s5["duration"])

        # ====================================================================
        # SCENE 6: KELOLA MEJA
        # ====================================================================
        s6 = scene_map["scene6_tables"]
        t6 = time.time()
        print(f"-> Merekam {s6['id']} (durasi: {s6['duration']:.2f}s)...")
        
        # Click sidebar Kelola Meja
        table_nav = page.locator("aside a:has-text('Kelola Meja')")
        box = table_nav.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            table_nav.click()

        page.wait_for_url("**/pos/tables")
        show_banner(page, s6['title'], s6['subtitle'])
        page.wait_for_timeout(2500)

        # Hover active tables
        tables = page.locator("h3:has-text('Meja')")
        for i in range(min(tables.count(), 4)):
            t_box = tables.nth(i).bounding_box()
            if t_box:
                page.mouse.move(t_box["x"] + t_box["width"]/2, t_box["y"] + t_box["height"]/2, steps=18)
                page.wait_for_timeout(2000)

        sync_wait(t6, s6["duration"])

        # ====================================================================
        # SCENE 7: DATA PELANGGAN & CRM
        # ====================================================================
        s7 = scene_map["scene7_customers"]
        t7 = time.time()
        print(f"-> Merekam {s7['id']} (durasi: {s7['duration']:.2f}s)...")

        cust_nav = page.locator("aside a:has-text('Pelanggan')")
        box = cust_nav.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            cust_nav.click()

        page.wait_for_url("**/pos/customers")
        show_banner(page, s7['title'], s7['subtitle'])
        page.wait_for_timeout(3000)

        # Hover rows in table
        rows = page.locator("tbody tr")
        for i in range(min(rows.count(), 3)):
            r_box = rows.nth(i).bounding_box()
            if r_box:
                page.mouse.move(r_box["x"] + 200, r_box["y"] + r_box["height"]/2, steps=15)
                page.wait_for_timeout(2000)

        sync_wait(t7, s7["duration"])

        # ====================================================================
        # SCENE 8: DAFTAR PESANAN & VOID
        # ====================================================================
        s8 = scene_map["scene8_orders_void"]
        t8 = time.time()
        print(f"-> Merekam {s8['id']} (durasi: {s8['duration']:.2f}s)...")

        orders_nav = page.locator("aside a:has-text('Daftar Pesanan')")
        box = orders_nav.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            orders_nav.click()

        page.wait_for_url("**/pos/orders")
        show_banner(page, s8['title'], s8['subtitle'])
        page.wait_for_timeout(3000)

        # Hover top completed order
        page.mouse.move(600, 260, steps=20)
        page.wait_for_timeout(3000)

        # Filter buttons
        btn_selesai = page.locator("button:has-text('Selesai')")
        if btn_selesai.count() > 0:
            b_box = btn_selesai.first.bounding_box()
            if b_box:
                page.mouse.move(b_box["x"] + b_box["width"]/2, b_box["y"] + b_box["height"]/2, steps=15)
                btn_selesai.first.click()
                page.wait_for_timeout(2500)

        btn_all = page.locator("button:has-text('Semua Pesanan')")
        if btn_all.count() > 0:
            b_box = btn_all.first.bounding_box()
            if b_box:
                page.mouse.move(b_box["x"] + b_box["width"]/2, b_box["y"] + b_box["height"]/2, steps=15)
                btn_all.first.click()
                page.wait_for_timeout(2000)

        sync_wait(t8, s8["duration"])

        # ====================================================================
        # SCENE 9: LAPORAN FINANSIAL & PROTEKSI ADMIN
        # ====================================================================
        s9 = scene_map["scene9_reports_admin"]
        t9 = time.time()
        print(f"-> Merekam {s9['id']} (durasi: {s9['duration']:.2f}s)...")

        # Cashier tries to click Laporan Kas -> triggers 403 Forbidden screen
        reports_nav = page.locator("aside a:has-text('Laporan Kas')")
        box = reports_nav.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            reports_nav.click()

        page.wait_for_url("**/pos/reports")
        show_banner(page, s9['title'], s9['subtitle'])
        page.wait_for_timeout(3000)

        # Logout cashier session to switch to Admin
        page.evaluate("fetch('/api/auth/logout', {method: 'POST'})")
        page.wait_for_timeout(800)

        # Click Login sebagai Admin button on the 403 page
        admin_login_link = page.locator("a:has-text('Login sebagai Admin')")
        if admin_login_link.count() > 0:
            l_box = admin_login_link.first.bounding_box()
            if l_box:
                page.mouse.move(l_box["x"] + l_box["width"]/2, l_box["y"] + l_box["height"]/2, steps=15)
                page.wait_for_timeout(800)
                admin_login_link.first.click()
        else:
            page.goto(f"{BASE_URL}/login")

        # On login page, click Role: ADMIN
        page.wait_for_url("**/login", timeout=10000)
        show_banner(page, s9['title'], s9['subtitle'])
        page.wait_for_timeout(1000)
        admin_btn = page.locator("button:has-text('Role: ADMIN')")
        if admin_btn.count() > 0:
            a_box = admin_btn.first.bounding_box()
            if a_box:
                page.mouse.move(a_box["x"] + a_box["width"]/2, a_box["y"] + a_box["height"]/2, steps=15)
                page.wait_for_timeout(1000)
                admin_btn.first.click()

        # Redirects to /pos as ADMIN
        page.wait_for_url("**/pos", timeout=10000)
        show_banner(page, s9['title'], s9['subtitle'])
        page.wait_for_timeout(1200)

        # Now click Laporan Kas as ADMIN
        rep_nav2 = page.locator("aside a:has-text('Laporan Kas')")
        r_box = rep_nav2.bounding_box()
        if r_box:
            page.mouse.move(r_box["x"] + r_box["width"]/2, r_box["y"] + r_box["height"]/2, steps=15)
            page.wait_for_timeout(1000)
            rep_nav2.click()

        page.wait_for_url("**/pos/reports", timeout=10000)
        show_banner(page, s9['title'], s9['subtitle'])
        page.wait_for_timeout(2000)

        # Hover financial KPI metric cards
        kpis = page.locator("div.grid div.bg-zinc-900")
        for i in range(min(kpis.count(), 3)):
            k_box = kpis.nth(i).bounding_box()
            if k_box:
                page.mouse.move(k_box["x"] + k_box["width"]/2, k_box["y"] + k_box["height"]/2, steps=15)
                page.wait_for_timeout(1500)

        sync_wait(t9, s9["duration"])

        # ====================================================================
        # SCENE 10: RINGKASAN & LOGOUT
        # ====================================================================
        s10 = scene_map["scene10_conclusion"]
        t10 = time.time()
        print(f"-> Merekam {s10['id']} (durasi: {s10['duration']:.2f}s)...")
        show_banner(page, s10['title'], s10['subtitle'])

        # Hover over admin user card in bottom sidebar
        user_card = page.locator("aside button[title*='Keluar']")
        box = user_card.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2, steps=18)
            page.wait_for_timeout(3500)
            user_card.click()

        # Returns to login
        page.wait_for_url("**/login", timeout=10000)
        show_banner(page, s10['title'], s10['subtitle'])
        page.mouse.move(640, 260, steps=20)
        page.wait_for_timeout(3000)

        sync_wait(t10, s10["duration"])

        print("Perekaman Playwright selesai! Menutup browser...")
        context.close()
        browser.close()

    print("Mencari file rekaman video webm...")
    recorded_files = [os.path.join(VIDEO_TEMP_DIR, f) for f in os.listdir(VIDEO_TEMP_DIR) if f.endswith(".webm")]
    if not recorded_files:
        raise Exception("File rekaman video tidak ditemukan!")

    latest_video = max(recorded_files, key=os.path.getmtime)
    print("Video mentah ditemukan:", latest_video)

    narration_audio = os.path.join(AUDIO_DIR, "full_narration.mp3")
    print("Audio narasi:", narration_audio)
    print("Target file MP4:", FINAL_OUTPUT_MP4)

    # Mux video and audio with ffmpeg
    print("Menggabungkan video dan audio dengan ffmpeg...")
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", latest_video,
        "-i", narration_audio,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        FINAL_OUTPUT_MP4
    ]

    res = subprocess.run(cmd, capture_output=True, text=True, errors="ignore")
    if res.returncode != 0:
        print("FFMPEG Error:", res.stderr)
        raise Exception("FFMPEG gagal menghasilkan video mp4!")

    print(f"SUKSES! Video hands-on berhasil disimpan ke: {FINAL_OUTPUT_MP4}")
    print(f"Ukuran file: {os.path.getsize(FINAL_OUTPUT_MP4) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    run_recording()
