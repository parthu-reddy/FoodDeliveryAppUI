import re

with open("src/components/CustomerDashboard.tsx", "r") as f:
    content = f.read()

# 1. Update State Variables
state_vars_old = """  const [apiAddrName, setApiAddrName] = useState('Office Hub');
  const [apiAddrDetails, setApiAddrDetails] = useState('Penthouse A, Cyber Greens, Phase III');"""
state_vars_new = """  const [apiAddrLabel, setApiAddrLabel] = useState('Home');
  const [apiAddrLine1, setApiAddrLine1] = useState('123 Main St');
  const [apiAddrLine2, setApiAddrLine2] = useState('Apt 4B');
  const [apiCity, setApiCity] = useState('Bangalore');
  const [apiState, setApiState] = useState('KA');
  const [apiZipCode, setApiZipCode] = useState('560001');"""

content = content.replace(state_vars_old, state_vars_new)

# 2. Update handleAddAddressApi
api_body_old = """    const body = {
      name: apiAddrName,
      addressLine: apiAddrDetails,
      latitude: parseFloat(apiAddrLat),
      longitude: parseFloat(apiAddrLng)
    };"""

api_body_new = """    const body = {
      label: apiAddrLabel,
      addressLine1: apiAddrLine1,
      addressLine2: apiAddrLine2,
      city: apiCity,
      state: apiState,
      zipCode: apiZipCode,
      latitude: parseFloat(apiAddrLat),
      longitude: parseFloat(apiAddrLng)
    };"""

content = content.replace(api_body_old, api_body_new)

# 3. Update address setting
content = content.replace(
    "setAddress(`${apiAddrName}: ${apiAddrDetails}`);",
    "setAddress(`${apiAddrLabel}: ${apiAddrLine1}, ${apiCity}`);"
)

content = content.replace(
    "onChange={(e) => setApiAddrName(e.target.value)}",
    "onChange={(e) => setApiAddrLabel(e.target.value)}"
)
content = content.replace(
    "value={apiAddrName}",
    "value={apiAddrLabel}"
)

# 4. Update Form Inputs
form_old = """                              <div className="space-y-1">
                                <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Line Details</label>
                                <input 
                                  type="text"
                                  value={apiAddrDetails}
                                  onChange={(e) => setApiAddrDetails(e.target.value)}
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500"
                                  required
                                />
                              </div>"""

form_new = """                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Line 1</label>
                                  <input 
                                    type="text"
                                    value={apiAddrLine1}
                                    onChange={(e) => setApiAddrLine1(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Line 2</label>
                                  <input 
                                    type="text"
                                    value={apiAddrLine2}
                                    onChange={(e) => setApiAddrLine2(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">City</label>
                                  <input 
                                    type="text"
                                    value={apiCity}
                                    onChange={(e) => setApiCity(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">State</label>
                                  <input 
                                    type="text"
                                    value={apiState}
                                    onChange={(e) => setApiState(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Zip Code</label>
                                  <input 
                                    type="text"
                                    value={apiZipCode}
                                    onChange={(e) => setApiZipCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/40 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none focus:border-rose-500"
                                    required
                                  />
                                </div>
                              </div>"""
                              
content = content.replace(form_old, form_new)

with open("src/components/CustomerDashboard.tsx", "w") as f:
    f.write(content)

print("Updated customer address API fields")
