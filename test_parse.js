const parseAddress = (desc) => {
    const parts = desc.split(',').map(p => p.trim());
    let zip = '';
    let state = '';
    let city = '';
    let currentIndex = parts.length - 1;
    
    if (currentIndex >= 0 && (parts[currentIndex].toLowerCase() === 'india' || parts[currentIndex].toLowerCase() === 'in')) {
        currentIndex--;
    }
    
    // Check if zip is attached to state (e.g., "Karnataka 560034")
    if (currentIndex >= 0) {
        const zipMatch = parts[currentIndex].match(/(.*?)\s+([\d\s-]{5,10})$/);
        if (zipMatch) {
            state = zipMatch[1].trim();
            zip = zipMatch[2].trim();
            currentIndex--;
        } else if (/^[\d\s-]{5,10}$/.test(parts[currentIndex])) {
            zip = parts[currentIndex];
            currentIndex--;
        }
    }
    
    if (currentIndex >= 0 && !state) {
        state = parts[currentIndex];
        currentIndex--;
    }
    if (currentIndex >= 0) {
        city = parts[currentIndex];
    }
    
    return { zip, state, city };
};

console.log(parseAddress("Ola Office, 1st Cross Rd, Koramangala, Bengaluru, Karnataka 560034, India"));
console.log(parseAddress("Some Place, Mumbai, Maharashtra, 400001, India"));
