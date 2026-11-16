# 🏋️ GymFlow - Gym Manager & Membership Automation Dashboard

A modern, responsive, zero-dependency Gym Management and Membership Automation Dashboard built using HTML5, modern CSS3, and Vanilla JavaScript. All membership records and settings are persisted locally in the browser's `LocalStorage`.

---

## ✨ Features Included

### 1. Top Daily Report Cards (Live Summaries)
* **Active Memberships (Chalu):** Real-time count of members with active status (> 3 days remaining).
* **Expiring Soon / Expired (Khatam ho chuki):** Total count of memberships requiring attention, with granular breakdown chips for `≤ 3 Days Expiring` and `Past Expired`.
* **Pending Payments (Baaki Payments in ₹):** Live sum in Indian Rupee format (`₹`) of all unpaid memberships.
* *Interactive:* Clicking on any card instantly filters the member list table below!

### 2. Dedicated Revenue & Financial Summary Section (कमाई और हिसाब-किताब)
Positioned right below the top 3 daily cards with real-time Month & Year filters:
* **Month & Year Filter Dropdown:** Select any month (January to December) and year (e.g. 2024 to 2028), defaulting automatically to the current month & current year. Includes a one-click *"Current Month (यह महीना)"* quick reset button.
* **4 Live Financial Summary Cards in ₹:**
  1. **Monthly Received Payment (₹):** Total cash amount collected from 'Paid' members in the selected month & year (*Is Mahine Ki Vasooli*).
  2. **Monthly Pending Payment (₹):** Total due amount from 'Pending' or 'Expired' members in the selected month & year (*Is Mahine Ka Baaki*).
  3. **Full Year Revenue (₹):** Total revenue collected across all 12 months of the selected year (*Poore Saal Ki Kul Kamai*).
  4. **Full Year Pending (₹):** Total uncollected / outstanding dues across the entire selected year (*Poore Saal Ka Baaki Paisa*).
* **Automatic Real-Time Sync:** Whenever a new member is added, edited, deleted, or renewed via *"Mark as Paid & Renew (+30 Days)"*, all 4 financial summary cards and the top 3 cards update instantly.
* **Interactive Filtering:** Clicking any of the 4 financial cards instantly filters the member roster below.

### 3. Anti-Fraud & Payment Security Features
* **Immutable Payment History & Unique Receipt IDs:**
  * Every paid transaction automatically generates a unique, sequential Receipt ID (e.g. `#REC-1001`, `#REC-1002`).
  * Records the exact Date & Time of payment (e.g. `16 Nov 2026, 09:30 AM`).
  * Stored in a read-only, locked **'Payment History'** modal for each member that cannot be edited or deleted.
* **Double-Payment Warning Guard (> 7 Days Active Protection):**
  * If a gym operator clicks *"Mark as Paid & Renew (+30 Days)"* on a member who already has **more than 7 days remaining** on an active paid plan, an alert modal interrupts the action.
  * Shows their current paid expiration date, days remaining, amount to be charged, and the proposed new expiration date.
  * Prevents accidental double-charging and duplicate billing unless explicitly confirmed as an advance renewal.
* **Instant WhatsApp Proof Receipt:**
  * The WhatsApp button dynamically switches to **'Proof Receipt'** for all paid members.
  * Generates an official payment confirmation message containing the **Receipt ID**, **Amount Paid (₹)**, and **Valid Till Date**.
* **Read-Only Tamper-Proof Audit Log:**
  * Dedicated **'Audit Log'** button in the header.
  * Permanently logs every action (new member registration, renewal, profile update, deletion, settings change, and backup export/restore) with microsecond timestamps and event categories.
  * Cannot be cleared, with instant search, category filters, and 1-click **Export to CSV**.

### 4. Printable Digital Fee Receipt Modal (डिजिटल फीस रसीद)
* Dedicated **'Receipt'** button next to each 'Paid' member in the roster.
* Opens an official printable payment receipt voucher containing:
  * **Gym Name, Tagline, Phone & Address**
  * **Verified "PAID • फीस जमा" official stamp**
  * **Unique Receipt Number (e.g., `REC-2026-0001`)**
  * **Member Name & WhatsApp Mobile Number**
  * **Amount Paid in ₹ (कुल जमा राशि)**
  * **Payment Date (तारीख)**
  * **Membership Expiry Date (वैधता / अंतिम तारीख)**
  * **Plan / Batch details**
  * **Authorized Signatory line**
* **1-Click Print / Save PDF:** Custom `@media print` CSS formats the receipt for standard paper and PDF export.
* **Share on WhatsApp:** 1-click button to send the structured receipt breakdown directly to the member's WhatsApp chat.

### 5. Settings & Full JSON Data Backup / Restore
* **'Settings & Backup'** button in the top navigation bar:
  * **Gym Profile & Branding:** Edit Gym Name, Tagline, Phone/WhatsApp, and Location address.
  * **Export Full JSON Backup:** Download a complete `.json` database file of all members, payment histories, and settings for safekeeping.
  * **Import Full JSON Backup:** Upload and restore any previously saved `.json` backup file with instant validation and dashboard refresh.

### 6. Add & Edit Member Form (Modal Dialog)
* **Fields:**
  * Member Full Name
  * WhatsApp Phone Number (10-digit Indian mobile with automatic `+91` handling)
  * Plan Amount in ₹
  * Join Date (defaults to today)
  * Expiry Date
  * Payment Status (`Paid` / `Pending`)
  * Plan / Batch Details (e.g. Cardio & Strength, Morning 7 AM)
* **Quick Duration Presets:** One-click duration buttons (`+1 Month / 30d`, `+3 Months`, `+6 Months`, `+1 Year`) to automatically calculate the expiry date.

### 7. Member List Table with Search, Filter & Color Badges
* **Color-Coded Status Badges:**
  * 🟢 **Green 'OK':** Active membership with > 3 days remaining.
  * 🟡 **Yellow 'Expiring in 3 Days':** Membership expiring within 0–3 days (with animated pulse indicator).
  * 🔴 **Red 'Renewal Miss':** Membership expired in the past.
* **Payment Badges:**
  * 💳 **Green 'Paid'**
  * ⚠️ **Red 'Baaki (Pending)'**
* **Instant Search:** Filter in real-time by Member Name, Phone Number, or Plan/Batch.
* **Filter Pills:** One-click filter tabs (`All`, `Active`, `Expiring in 3d`, `Renewal Miss`, `Pending`, `Paid`).
* **Sort Options:** By Expiry Date (Soonest/Latest), Member Name (A-Z), Plan Amount (High-to-Low), or Recently Joined.

### 8. One-Click WhatsApp Proof & Reminder (`wa.me` Integration)
* **Paid Members:** Send 1-click official proof receipt with Receipt ID, Amount Paid (₹), and Valid Till Date.
* **Pending / Expired Members:** Send 1-click polite reminder in Hindi/English to clear dues or renew.

### 9. Quick Actions & LocalStorage Management
* **Mark as Paid & Renew (+30 Days):** Instantly adds 30 days to the expiry date (calculated from current expiry or today if expired) and marks the payment as Paid.
* **Delete Member:** Modal confirmation safeguard before deleting records.
* **Export Data to CSV/Excel:** Instant one-click backup formatted with UTF-8 BOM for seamless import into Google Sheets and Microsoft Excel.
* **Print / PDF View:** Ready-to-print formatted report.
* **Edit Gym Name:** Click the edit pencil icon next to the gym title to customize your Gym / Fitness Center brand name across the dashboard and WhatsApp messages.
* **Dark / Light Theme Toggle:** Beautiful modern Obsidian Dark theme by default, with an instant toggle for Crisp Light mode.

### 7. Pre-Loaded Sample Data
Pre-loaded with 5 representative gym members so you can test all features right out of the box:
1. **Rahul Sharma** - Active (+25 days), ₹1,500, Paid (Status: `OK`)
2. **Priya Patel** - Expiring in 2 days (+2 days), ₹2,000, Paid (Status: `Expiring in 3 Days`)
3. **Amit Kumar** - Expired 4 days ago (-4 days), ₹1,200, Pending (Status: `Renewal Miss`, Payment: `Pending`)
4. **Sneha Verma** - Active (+75 days), ₹3,500, Paid (Status: `OK`)
5. **Vikram Singh** - Expiring tomorrow (+1 day), ₹1,500, Pending (Status: `Expiring in 3 Days`, Payment: `Pending`)

---

## 🚀 How to Run

1. Open the folder: `c:\Users\Dell\Downloads\Gym Manager`
2. Simply double click `index.html` to open it in **Google Chrome**, **Microsoft Edge**, **Mozilla Firefox**, or any modern web browser.
3. No server or internet connection is required — everything runs 100% locally in the browser!
