const fs = require('fs');
let content = fs.readFileSync('src/components/DeliveryDashboard.tsx', 'utf8');

content = content.replace(/setRiderName\(data\.rider\.name\);/, 'if (onNameUpdate) onNameUpdate(data.rider.name);');

// Remove fetchDevices, handleRemoveDevice, handleRemoveAllDevices and the useEffect
const removeDevicesStart = content.indexOf('  const [devices, setDevices] = useState<any[]>([]);');
const handleRemoveAllDevicesEnd = content.indexOf('  const [showAccountModal, setShowAccountModal]'); // oh wait, we don't know where it ends.

