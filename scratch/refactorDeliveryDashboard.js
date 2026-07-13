const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryDashboard.tsx', 'utf8');

// 1. Remove state
content = content.replace(/const \[showProfile, setShowProfile\] = useState\(false\);\n/, '');
content = content.replace(/const \[riderName, setRiderName\] = useState\(""\);\n/, '');

// 2. Remove first Profile button
content = content.replace(
  /<button\s+onClick=\{\(\) => setShowProfile\(true\)\}\s+className="p-2\.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-\[#f0ede6\] transition-all cursor-pointer"\s+title="Profile"\s*>\s*<User className="w-4 h-4 text-indigo-500" \/>\s*<\/button>\s*/,
  ''
);

// 3. Remove showProfile AnimatePresence block
const showProfileStart = content.indexOf('<AnimatePresence>\n        {showProfile && (');
const showProfileEnd = content.indexOf('<PartnerAccountModal');
if (showProfileStart !== -1 && showProfileEnd !== -1) {
  content = content.substring(0, showProfileStart) + content.substring(showProfileEnd);
}

// 4. Update PartnerAccountModal
const partnerModalRegex = /<PartnerAccountModal[\s\S]*?<\/PartnerAccountModal>/;
const newPartnerModal = `<PartnerAccountModal 
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        userName={userName}
        userPhone={riderPhone || userPhone}
        onLogout={onLogout}
        onNameUpdate={onNameUpdate}
        onSaveExtra={async (newName) => {
          try {
            const res = await fetch("/api/delivery/drivers", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": "Bearer la-bouffe-jwt-token-courier" },
              body: JSON.stringify({ name: newName, phoneNumber: riderPhone || userPhone, vehicleNumber, photoUrl })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.id) setRiderId(data.id);
            }
          } catch (e) {
            console.error("Failed to onboard driver", e);
          }
        }}
      >
        <div className="space-y-1.5 mt-4">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Vehicle Registration</label>
          <input 
            type="text" 
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            placeholder="e.g. KA01AB1234"
            className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 text-sm font-medium text-slate-900 dark:text-[#f0ede6] bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
          />
        </div>
        <div className="space-y-1.5 mt-4">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Profile Photo URL</label>
          <input 
            type="url" 
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 text-sm font-medium text-slate-900 dark:text-[#f0ede6] bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
          />
        </div>
        {photoUrl && (
          <div className="mt-3 flex justify-center">
             <img src={photoUrl} alt="Profile" className="w-20 h-20 rounded-xl object-cover border border-rose-500/30" />
          </div>
        )}
      </PartnerAccountModal>`;
content = content.replace(partnerModalRegex, newPartnerModal);

// 5. Remove handleOnboard definition
const handleOnboardStart = content.indexOf('  const handleOnboard = async (e: React.FormEvent) => {');
const handleToggleStart = content.indexOf('  const handleToggleOnline = async () => {');
if (handleOnboardStart !== -1 && handleToggleStart !== -1) {
  content = content.substring(0, handleOnboardStart) + content.substring(handleToggleStart);
}

// 6. Replace usages of riderName with userName
content = content.replace(/riderName/g, 'userName');

// 7. Fix setUserName in useEffect
content = content.replace(/setUserName\(data\.rider\.name\);/g, 'if (onNameUpdate) onNameUpdate(data.rider.name);');

// 8. Fix setShowProfile(true) in useEffect -> setShowAccountModal(true)
content = content.replace(/setShowProfile\(true\);/g, 'setShowAccountModal(true);');
content = content.replace(/setShowProfile\(false\);/g, 'setShowAccountModal(false);');

fs.writeFileSync('src/components/DeliveryDashboard.tsx', content);
console.log('Success');
