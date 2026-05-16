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

            // Fragment naming convention
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

        // Extract MM-DD from path names securely
        let monthNum = 0, dayNum = 0;
        if (fileName) {
            const dateMatch = fileName.match(/(\d{2})-(\d{2})/);
            if (dateMatch) {
                monthNum = parseInt(dateMatch[1], 10);
                dayNum = parseInt(dateMatch[2], 10);
            }
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
                // Execute fallback grid generator if file is missing
                const fallbackContent = getTimetableFallback(monthNum, dayNum);
                renderContent(fallbackContent);
            });
    };

    // --- 3.1 RENDER TRANSITION CONTENT ---
    function renderContent(content) {
        if (!loadingLine || !fragmentContainer) return;
        loadingLine.style.width = '100%';
        setTimeout(() => {
            fragmentContainer.innerHTML = content;
            loadingLine.style.opacity = '0';
            setTimeout(() => { loadingLine.style.width = '0%'; }, 300);
            
            // Re-bind click analytics listeners for freshly injected dynamic cards
            bindDownloadListeners();
        }, 200);
    }

    // --- 3.2 DYNAMIC GRID FALLBACK GENERATOR ---
    function getTimetableFallback(month, day) {
        if (month === 0 || day === 0) return getEmptyStateHTML();

        const dateVal = (month * 100) + day;
        const targetYear = new Date().getFullYear();
        const targetDateObj = new Date(targetYear, month - 1, day);
        const dayOfWeek = targetDateObj.toLocaleDateString('en-US', { weekday: 'long' });

        let semesterLabel = "";
        let classesArray = [];

        // 1. Semester 1 range mapping (18-08 to 23-12)
        if (dateVal >= 818 && dateVal <= 1223) {
            semesterLabel = "Semester 1";
            classesArray = getSem1Classes(dayOfWeek);
        } 
        // 2. Semester 2 range mapping (02-02 to 29-05)
        else if (dateVal >= 202 && dateVal <= 529) {
            semesterLabel = "Semester 2";
            classesArray = getSem2Classes(dayOfWeek);
        }

        // Return empty layout if outside active semester operational windows or on weekends
        if (!semesterLabel || classesArray.length === 0) {
            return getEmptyStateHTML();
        }

        // Map array contents to structural fragment string components
        let cardsHTML = '';
        classesArray.forEach((cls, index) => {
            // Automatically make the first class of the day highlighted
            const highlightClass = index === 0 ? 'highlight' : '';
            cardsHTML += `
                <div class="stat-card ${highlightClass}">
                    <div class="stat-text">
                        <span class="lab-time">${cls.time}</span>
                        <div class="lab-name">${cls.name}</div>
                    </div>
                    <div class="download-container">
                        <a href="${cls.link}" target="_blank" class="download-link"><i class="fas fa-download"></i></a>
                    </div>
                </div>`;
        });

        return `
            <style>
                .stats-row {
                    display: grid;
                    gap: 15px;
                    width: 100%;
                    padding: 10px 10px 0 10px;
                    box-sizing: border-box;
                }
                @media (max-width: 767px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 768px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
                .stat-card {
                    background: #ffffff;
                    padding: 18px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    border: 1px solid #eee;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 110px;
                    transition: transform 0.2s ease;
                }
                .stat-card:hover { transform: translateY(-2px); }
                .stat-card.highlight { background-color: #eef6ff; border-color: #4a90e2; }
                .lab-time { font-size: 11px; color: #4a90e2; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; display: block; }
                .lab-name { font-size: 16px; font-weight: 600; color: #333; margin-top: 6px; }
                .download-container { margin-top: 12px; text-align: right; }
                .download-link { text-decoration: none; color: #888; font-size: 16px; transition: color 0.2s; }
                .download-link:hover { color: #4a90e2; }
            </style>
            
            <h3 style="font-size: 14px; color: #666; margin: 10px 0 2px 12px; font-weight: 600;">
                ${semesterLabel} &bull; ${dayOfWeek} Schedule
            </h3>
            
            <p style="font-size: 11px; color: #999; margin: 0 0 10px 12px; font-style: italic;">
                * This is according to the timetable, not actual class shedule.
            </p>
            
            <div class="stats-row">
                ${cardsHTML}
            </div>
        `;
    }

    function getEmptyStateHTML() {
        return `
            <div class="stats-row">
                <div class="stat-card">No Notes Yet</div>
                <div class="stat-card highlight">No Classes</div>
            </div>`;
    }

    // Dataset Parser for Semester 1 Schedules with Shared Drive Resource Targets
    function getSem1Classes(day) {
        const links = {
            ADSA: "https://drive.google.com/drive/folders/11M5F2-jUQEhUEeVtJvO74NyZcMdLMd5R?usp=drive_link",
            ADSALAB: "https://drive.google.com/drive/folders/1dG0yMHsAMTZtc7d_XZuVwT4u_aVe0U4e?usp=drive_link",
            COMPLAB: "https://drive.google.com/drive/folders/1Qmgo2_cR962_si_3yD3AbfzNvnrDrB5L?usp=drive_link",
            DM: "https://drive.google.com/drive/folders/1rQLvS_jVMmfT3nM-DNggRA0IImZm4tl7?usp=drive_link",
            ERPW: "https://drive.google.com/drive/folders/1wwuHwLgRP6KqljeqCDO9WZIkMm1bsKg0?usp=drive_link",
            MME: "https://drive.google.com/drive/folders/1YC4QhF7WBHvssfIvs_Doe-m9bs0AXnpV?usp=drive_link",
            RMIPR: "https://drive.google.com/drive/folders/1bvPa0utuGEaD0PWKm8Rsj2YHOxLBi_iS?usp=drive_link",
            WSN: "https://drive.google.com/drive/folders/1OPaR5iL1_fEir-iW61-Do5ib3rQI8BnQ?usp=drive_link"
        };

        switch(day) {
            case 'Monday':
                return [
                    { time: '10:00 AM', name: 'RM & IPR', link: links.RMIPR },
                    { time: '11:00 AM', name: 'DM', link: links.DM },
                    { time: '12:00 PM', name: 'WSN', link: links.WSN },
                    { time: '02:00 PM', name: 'ERPW', link: links.ERPW },
                    { time: '04:00 PM', name: 'ADSA', link: links.ADSA }
                ];
            case 'Tuesday':
                return [
                    { time: '10:00 AM', name: 'MME', link: links.MME },
                    { time: '11:00 AM', name: 'WSN', link: links.WSN },
                    { time: '02:00 PM', name: 'ADSA LAB', link: links.ADSALAB }
                ];
            case 'Wednesday':
                return [
                    { time: '10:00 AM', name: 'RM & IPR', link: links.RMIPR },
                    { time: '11:00 AM', name: 'DM', link: links.DM },
                    { time: '12:00 PM', name: 'WSN', link: links.WSN },
                    { time: '02:00 PM', name: 'COMPUTING LAB-I', link: links.COMPLAB },
                    { time: '04:00 PM', name: 'ADSA', link: links.ADSA }
                ];
            case 'Thursday':
                return [
                    { time: '12:00 PM', name: 'MME', link: links.MME },
                    { time: '02:00 PM', name: 'COMPUTING LAB-I', link: links.COMPLAB },
                    { time: '04:00 PM', name: 'ADSA', link: links.ADSA }
                ];
            case 'Friday':
                return [
                    { time: '01:00 PM', name: 'DM', link: links.DM },
                    { time: '02:00 PM', name: 'ADSA LAB', link: links.ADSALAB }
                ];
            default: return [];
        }
    }

    // Dataset Parser for Semester 2 Schedules with Shared Drive Resource Targets
    function getSem2Classes(day) {
        const links = {
            CC: "https://drive.google.com/drive/folders/1gviuukHVJqeCgHXWDwRABFPbN8DiXSPg?usp=drive_link",
            COMPLAB: "https://drive.google.com/drive/folders/1r1gQL-I2axGRAnESTlS3q-QIMM68axRg?usp=drive_link",
            DM: "https://drive.google.com/drive/folders/1uB3C2N7MoWjID2MY8KWTOaAhgYmT6KyI?usp=drive_link",
            HPC: "https://drive.google.com/drive/folders/1HUXiKzqD6vsDcijTQbDBaZ97mbBhrjMW?usp=drive_link",
            IOT: "https://drive.google.com/drive/folders/1-JUR_HLiJWqICuXajGuFaUwTkVGRosvF?usp=drive_link",
            MLA: "https://drive.google.com/drive/folders/14eoY7GC1ijvCVoyII22XGs1ELLL5n8-0?usp=drive_link",
            OOAD: "https://drive.google.com/drive/folders/19OhzprnOYEk2IPNNxTgFwzkP_Xov7nZD?usp=drive_link",
            PROJECT: "#"
        };

        switch(day) {
            case 'Monday':
                return [{ time: '11:00 AM', name: 'Disaster Mgmt', link: links.DM }];
            case 'Tuesday':
                return [
                    { time: '09:00 AM', name: 'IoT', link: links.IOT },
                    { time: '11:00 AM', name: 'OOAD', link: links.OOAD },
                    { time: '12:00 PM', name: 'MLA', link: links.MLA }
                ];
            case 'Wednesday':
                return [
                    { time: '09:00 AM', name: 'Project', link: links.PROJECT },
                    { time: '10:00 AM', name: 'Comp Lab-II', link: links.COMPLAB },
                    { time: '12:00 PM', name: 'HPC', link: links.HPC },
                    { time: '02:00 PM', name: 'Comp Lab-II', link: links.COMPLAB },
                    { time: '04:00 PM', name: 'CC', link: links.CC }
                ];
            case 'Thursday':
                return [
                    { time: '10:00 AM', name: 'OOAD', link: links.OOAD },
                    { time: '11:00 AM', name: 'HPC', link: links.HPC },
                    { time: '12:00 PM', name: 'IoT', link: links.IOT },
                    { time: '02:00 PM', name: 'Project', link: links.PROJECT },
                    { time: '03:00 PM', name: 'MLA', link: links.MLA },
                    { time: '04:00 PM', name: 'CC', link: links.CC }
                ];
            case 'Friday':
                return [
                    { time: '09:00 AM', name: 'OOAD', link: links.OOAD },
                    { time: '10:00 AM', name: 'CC', link: links.CC },
                    { time: '11:00 AM', name: 'HPC', link: links.HPC },
                    { time: '12:00 PM', name: 'MLA', link: links.MLA }
                ];
            default: return [];
        }
    }

    // --- 3.3 ANALYTICS ACTION HANDLER ---
    function bindDownloadListeners() {
        document.querySelectorAll('.download-link').forEach(btn => {
            // Remove previous event listener to avoid duplicate logging if double-bound
            btn.replaceWith(btn.cloneNode(true));
        });

        document.querySelectorAll('.download-link').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const targetCard = this.closest('.stat-card');
                if (!targetCard) return;
                
                const classNameEl = targetCard.querySelector('.lab-name');
                if (classNameEl) {
                    console.log("Downloading for: " + classNameEl.innerText);
                }
            });
        });
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

    document.addEventListener('click', () => {
        utilityMenu.classList.remove('show');
    });
}
