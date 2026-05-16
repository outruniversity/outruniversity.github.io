document.addEventListener('DOMContentLoaded', () => {
    const scroller = document.getElementById('dateScroller');
    const loadingLine = document.getElementById('loadingLine');
    const fragmentContainer = document.getElementById('fragmentContainer');
    const profileToggle = document.getElementById('profileToggle');
    const branchMenu = document.getElementById('branchMenu');

    // --- 1. GENERATE 365 DAYS ---
    const generateCalendar = () => {
        const now = new Date();
        
        // Get Today's Date in IST using 2-digit month (MM) and day (DD)
        const todayIST = new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        }).format(now);

        const year = now.getFullYear();
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        
        let html = '';
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayNum = d.getDate().toString().padStart(2, '0');
            const monthNum = (d.getMonth() + 1).toString().padStart(2, '0'); // MM (01-12)
            const monthShort = d.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
            
            // Format current loop date to compare with todayIST (DD/MM/YYYY)
            const currentLoopDate = new Intl.DateTimeFormat('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(d);

            const isActive = currentLoopDate === todayIST ? 'active' : '';
            const idTag = currentLoopDate === todayIST ? 'id="today"' : '';

            // UPDATED Fragment naming: activity/MM-DD.html
            const fileName = `dailyactivity/${monthNum}-${dayNum}.html`;

            html += `
                <div class="date-item ${isActive}" ${idTag} data-fragment="${fileName}">
                    <span class="month">${monthShort}</span>
                    <div class="circle">${dayNum}</div>
                </div>
            `;
        }
        scroller.innerHTML = html;

        // Auto-scroll to today (Centered)
        setTimeout(() => {
            const todayEl = document.getElementById('today');
            if (todayEl) {
                todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }, 300);
    };

    // --- 2. BRANCH DROPDOWN LOGIC ---
    if (profileToggle && branchMenu) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            branchMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            branchMenu.classList.remove('show');
        });
    }

// --- 3. FRAGMENT LOADING LOGIC ---
    const loadFragment = (fileName) => {
        if (!loadingLine) return;

        loadingLine.style.opacity = '1';
        loadingLine.style.width = '30%';

        // Extract MM-DD from the file path (e.g., "dailyactivity/02-15.html" -> "02-15")
        const dateMatch = fileName.match(/(\d{2})-(\d{2})/);
        let monthNum = 0, dayNum = 0;
        if (dateMatch) {
            monthNum = parseInt(dateMatch[1], 10);
            dayNum = parseInt(dateMatch[2], 10);
        }

        fetch(fileName)
            .then(response => {
                if (!response.ok) throw new Error('Not Found');
                return response.text();
            })
            .then(html => {
                renderContent(html);
            })
            .catch(() => {
                // Fallback to Timetable Logic if file is missing
                const fallbackContent = getTimetableFallback(monthNum, dayNum);
                renderContent(fallbackContent);
            });
    };

    // --- 3.1 TIMETABLE FALLBACK GENERATOR ---
    function getTimetableFallback(month, day) {
        // Helper to convert MM-DD into a comparable integer value (MMDD)
        const dateVal = (month * 100) + day;
        
        // Calculate Day of Week for the target date (needed to filter classes)
        // Uses current year since the calendar scroller generates for the current year
        const targetYear = new Date().getFullYear();
        const targetDateObj = new Date(targetYear, month - 1, day);
        const dayOfWeek = targetDateObj.toLocaleDateString('en-US', { weekday: 'long' });

        let semesterTitle = "";
        let daySlotsHTML = "";

        // Determine Semester range
        if (dateVal >= 818 && dateVal <= 1223) {
            semesterTitle = "Semester 1 Timetable";
            daySlotsHTML = getSem1Slots(dayOfWeek);
        } else if (dateVal >= 202 && dateVal <= 529) {
            semesterTitle = "Semester 2 Timetable";
            daySlotsHTML = getSem2Slots(dayOfWeek);
        }

        // Default layout if outside semesters or on weekends
        if (!semesterTitle || !daySlotsHTML) {
            return `
                <div class="stats-row">
                    <div class="stat-card">No Notes Yet</div>
                    <div class="stat-card highlight">No Classes</div>
                </div>`;
        }

        // Return formatted schedule with the disclaimer note at the bottom
        return `
            <div class="mobile-timetable" style="padding: 0; margin: 0;">
                <h3 style="font-size: 16px; color: var(--primary); margin: 0 0 15px 0;">${semesterTitle} (${dayOfWeek})</h3>
                <div class="day-card" style="margin-bottom: 15px;">
                    ${daySlotsHTML}
                </div>
                <p style="font-size: 11px; color: #999; margin-top: 15px; font-style: italic;">
                    * This is according to the timetable, not actual class schedule.
                </p>
            </div>`;
    }

    // Helper data for Semester 1 Mobile Layout
    function getSem1Slots(day) {
        switch(day) {
            case 'Monday':
                return `
                    <div class="slot"><span class="time">10:00 - 11:00</span><span class="subject">RM & IPR</span></div>
                    <div class="slot"><span class="time">11:00 - 12:00</span><span class="subject">DM</span></div>
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">WSN</span></div>
                    <div class="slot"><span class="time">02:00 - 04:00</span><span class="subject">ERPW</span></div>
                    <div class="slot"><span class="time">04:00 - 05:00</span><span class="subject">ADSA</span></div>`;
            case 'Tuesday':
                return `
                    <div class="slot"><span class="time">10:00 - 11:00</span><span class="subject">MME</span></div>
                    <div class="slot"><span class="time">11:00 - 12:00</span><span class="subject">WSN</span></div>
                    <div class="slot"><span class="time">02:00 - 04:00</span><span class="subject">ADSA LAB</span></div>`;
            case 'Wednesday':
                return `
                    <div class="slot"><span class="time">10:00 - 11:00</span><span class="subject">RM & IPR</span></div>
                    <div class="slot"><span class="time">11:00 - 12:00</span><span class="subject">DM</span></div>
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">WSN</span></div>
                    <div class="slot"><span class="time">02:00 - 04:00</span><span class="subject">COMPUTING LAB-I</span></div>
                    <div class="slot"><span class="time">04:00 - 05:00</span><span class="subject">ADSA</span></div>`;
            case 'Thursday':
                return `
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">MME</span></div>
                    <div class="slot"><span class="time">02:00 - 04:00</span><span class="subject">COMPUTING LAB-I</span></div>
                    <div class="slot"><span class="time">04:00 - 05:00</span><span class="subject">ADSA</span></div>`;
            case 'Friday':
                return `
                    <div class="slot"><span class="time">01:00 - 02:00</span><span class="subject">DM</span></div>
                    <div class="slot"><span class="time">02:00 - 04:00</span><span class="subject">ADSA LAB</span></div>`;
            default:
                return ''; // Weekends
        }
    }

    // Helper data for Semester 2 Mobile Layout
    function getSem2Slots(day) {
        switch(day) {
            case 'Monday':
                return `<div class="slot"><span class="time">11:00 - 01:00</span><span class="subject">Disaster Mgmt</span></div>`;
            case 'Tuesday':
                return `
                    <div class="slot"><span class="time">09:00 - 11:00</span><span class="subject">IoT</span></div>
                    <div class="slot"><span class="time">11:00 - 12:00</span><span class="subject">OOAD</span></div>
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">MLA</span></div>`;
            case 'Wednesday':
                return `
                    <div class="slot"><span class="time">09:00 - 10:00</span><span class="subject">Project</span></div>
                    <div class="slot"><span class="time">10:00 - 12:00</span><span class="subject">Comp Lab-II</span></div>
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">HPC</span></div>
                    <div class="slot"><span class="time">02:00 - 04:00</span><span class="subject">Comp Lab-II / Project</span></div>
                    <div class="slot"><span class="time">04:00 - 05:00</span><span class="subject">CC</span></div>`;
            case 'Thursday':
                return `
                    <div class="slot"><span class="time">10:00 - 11:00</span><span class="subject">OOAD</span></div>
                    <div class="slot"><span class="time">11:00 - 12:00</span><span class="subject">HPC</span></div>
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">IoT</span></div>
                    <div class="slot"><span class="time">01:00 - 02:00</span><span class="subject">Project</span></div>
                    <div class="slot"><span class="time">02:00 - 03:00</span><span class="subject">Project</span></div>
                    <div class="slot"><span class="time">03:00 - 04:00</span><span class="subject">MLA</span></div>
                    <div class="slot"><span class="time">04:00 - 05:00</span><span class="subject">CC</span></div>`;
            case 'Friday':
                return `
                    <div class="slot"><span class="time">09:00 - 10:00</span><span class="subject">OOAD</span></div>
                    <div class="slot"><span class="time">10:00 - 11:00</span><span class="subject">CC</span></div>
                    <div class="slot"><span class="time">11:00 - 12:00</span><span class="subject">HPC</span></div>
                    <div class="slot"><span class="time">12:00 - 01:00</span><span class="subject">MLA</span></div>`;
            default:
                return ''; // Weekends
        }
    }

    // --- 4. EVENT DELEGATION FOR SCROLLER ---
    scroller.addEventListener('click', (e) => {
        const item = e.target.closest('.date-item');
        if (!item) return;

        document.querySelectorAll('.date-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        loadFragment(item.getAttribute('data-fragment'));
    });

    // --- 5. INITIALIZE ---
    generateCalendar();
    
    const todayActive = document.querySelector('.date-item.active');
    if (todayActive) {
        loadFragment(todayActive.getAttribute('data-fragment'));
    }

    // --- 6. DESKTOP SCROLL SUPPORT ---
    scroller.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            scroller.scrollLeft += e.deltaY * 2;
        }
    });
});

// --- 7. BOTTOM NAV ACADEMICS UTILITY ---
const academicsTrigger = document.getElementById('academicsTrigger');
const utilityMenu = document.getElementById('utilityMenu');

if (academicsTrigger && utilityMenu) {
    academicsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        utilityMenu.classList.toggle('show');
    });

    // Close menu when clicking anywhere else
    document.addEventListener('click', () => {
        utilityMenu.classList.remove('show');
    });
}
